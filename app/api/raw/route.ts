import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { exiftoolPath } from 'exiftool-vendored';
import { NextRequest, NextResponse } from 'next/server';
import sharp, { type Metadata, type Sharp } from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT = path.join(process.cwd(), 'public', 'events');
const VERSION = 'sony-preview-v7';
const CACHE = path.join(process.cwd(), '.bsn-cache', VERSION);
const TAGS = ['PreviewImage', 'JpgFromRaw', 'OtherImage', 'ThumbnailImage'];
const pending = new Map<string, Promise<Buffer>>();
const run = promisify(execFile);

function isInside(root: string, target: string) {
  const relative = path.relative(root, target);
  return relative !== '' && relative !== '..' &&
    !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function validSegment(segment: string) {
  return segment.length > 0 && !/[<>:"/\\|?*\x00-\x1f]/.test(segment) &&
    !/[. ]$/.test(segment) &&
    !/^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(segment);
}

function orient(image: Sharp, orientation: number) {
  switch (orientation) {
    case 2: return image.flop();
    case 3: return image.rotate(180);
    case 4: return image.flip();
    case 5: return image.flip().rotate(90);
    case 6: return image.rotate(90);
    case 7: return image.flop().rotate(90);
    case 8: return image.rotate(270);
    default: return image;
  }
}

async function buildPreview(source: string) {
  const executable = await exiftoolPath();
  const options = { encoding: 'buffer' as const, maxBuffer: 32 * 1024 * 1024,
    timeout: 30_000, windowsHide: true };
  const { stdout } = await run(executable, [
    '-j', '-n', '-G1', '-IFD0:Orientation', '-ExifIFD:ColorSpace',
    ...TAGS.map(tag => '-' + tag), source,
  ], options);
  const [tags] = JSON.parse(stdout.toString('utf8')) as Record<string, unknown>[];
  const available = new Set(Object.keys(tags).map(key => key.split(':').pop()));
  const rawOrientation = Number(tags['IFD0:Orientation']);
  const rawColor = Number(tags['ExifIFD:ColorSpace']);

  let best: { bytes: Buffer; metadata: Metadata; pixels: number } | undefined;
  for (const tag of TAGS) {
    if (!available.has(tag)) continue;
    const { stdout: bytes } = await run(executable, ['-b', '-' + tag, source], options);
    if (bytes.length === 0) continue;
    const metadata = await sharp(bytes).metadata().catch(() => undefined);
    if (metadata?.format !== 'jpeg' || !metadata.width || !metadata.height) continue;
    const pixels = metadata.width * metadata.height;
    if (!best || pixels > best.pixels) best = { bytes, metadata, pixels };
  }
  if (!best) return undefined;

  // Les JPEG Sony sans ICC héritent ici de l'espace sRGB indiqué par l'ARW.
  // Pour un autre espace sans ICC, passer par un export RAW vers sRGB.
  if (!best.metadata.hasProfile && rawColor !== 1) return undefined;

  const image = sharp(best.bytes);
  if (best.metadata.orientation !== undefined) {
    image.autoOrient();
  } else if (Number.isInteger(rawOrientation) && rawOrientation >= 1 && rawOrientation <= 8) {
    orient(image, rawOrientation);
  }
  return image.withIccProfile('srgb')
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toBuffer();
}

async function getPreview(source: string, output: string) {
  const running = pending.get(output);
  if (running) return running;

  const task = (async () => {
    try {
      return await readFile(output);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    const jpeg = await buildPreview(source);
    if (!jpeg) return Buffer.alloc(0);

    await mkdir(CACHE, { recursive: true });
    const temporary = output + '.' + randomUUID() + '.tmp';
    try {
      await writeFile(temporary, jpeg, { flag: 'wx' });
      await rename(temporary, output).catch(async (error: NodeJS.ErrnoException) => {
        if (!['EEXIST', 'EPERM'].includes(error.code ?? '')) throw error;
        // Un autre processus peut avoir publié le même rendu entre-temps.
        if (!(await stat(output).catch(() => undefined))?.isFile()) throw error;
      });
    } finally {
      await rm(temporary, { force: true });
    }
    return jpeg;
  })();

  pending.set(output, task);
  try {
    return await task;
  } finally {
    pending.delete(output);
  }
}

export async function GET(request: NextRequest) {
  const folder = request.nextUrl.searchParams.get('folder');
  const file = request.nextUrl.searchParams.get('file');

  if (folder === null || !file || !validSegment(file) || !/\.arw$/i.test(file) ||
      (folder !== '' && !folder.split('/').every(validSegment))) {
    return new NextResponse('Fichier invalide', { status: 400 });
  }

  try {
    const root = await realpath(ROOT);
    const requested = path.resolve(root, folder, file);
    if (!isInside(root, requested)) {
      return new NextResponse('Accès interdit', { status: 403 });
    }
    const source = await realpath(requested);
    if (!isInside(root, source)) {
      return new NextResponse('Accès interdit', { status: 403 });
    }

    const info = await stat(source);
    if (!info.isFile() || !/\.arw$/i.test(source)) {
      return new NextResponse('Fichier invalide', { status: 400 });
    }
    const key = createHash('sha256')
      .update(JSON.stringify([source, info.size, info.mtimeMs, info.ctimeMs]))
      .digest('hex');
    const jpeg = await getPreview(source, path.join(CACHE, key + '.jpg'));
    if (jpeg.length === 0) {
      return new NextResponse('Aperçu JPEG exploitable en sRGB indisponible', { status: 422 });
    }

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(jpeg.length),
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new NextResponse('Photographie introuvable', { status: 404 });
    }
    console.error('[BSN] Aperçu ARW', file, error);
    return new NextResponse('Impossible de générer l’aperçu', { status: 500 });
  }
}

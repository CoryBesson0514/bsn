import { NextResponse } from 'next/server';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================
   BSN — PHOTOGRAPHIC ARCHIVES API
========================================= */

const ROOT = path.join(
  process.cwd(),
  'public',
  'events'
);

const SUPPORTED_FORMATS =
  /\.(jpg|jpeg|png|webp|avif|arw)$/i;

const IGNORED_FOLDERS = [
  'converted',
  'cache',
  'thumbnails',
  '.bsn-cache',
];

type Collections = Record<string, string[]>;

/* =========================================
   GENERATION DES URL
========================================= */

function createPhotoUrl(
  folder: string,
  filename: string
): string {

  if (/\.arw$/i.test(filename)) {
    return (
      `/api/raw?folder=${encodeURIComponent(folder)}` +
      `&file=${encodeURIComponent(filename)}&v=7`
    );
  }

  const encodedFolder = folder
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  return [
    '/events',
    encodedFolder,
    encodeURIComponent(filename),
  ]
    .filter(Boolean)
    .join('/');
}

/* =========================================
   PRIORITE DES FORMATS
========================================= */

function getPriority(filename: string): number {

  const extension = path
    .extname(filename)
    .toLowerCase();

  switch (extension) {
    case '.png':
      return 1;

    case '.jpg':
    case '.jpeg':
      return 2;

    case '.webp':
    case '.avif':
      return 3;

    case '.arw':
      return 4;

    default:
      return 99;
  }
}

/* =========================================
   DETECTION RECURSIVE DES COLLECTIONS
========================================= */

async function scanDirectory(
  directory: string,
  relative: string,
  collections: Collections
): Promise<void> {

  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  entries.sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', {
      numeric: true,
      sensitivity: 'base',
    })
  );

  /* PHOTOGRAPHIES COMPATIBLES */

  const files = entries.filter(entry =>
    entry.isFile() &&
    !entry.name.startsWith('.') &&
    SUPPORTED_FORMATS.test(entry.name)
  );

  /* SUPPRESSION DES DOUBLONS */

  const uniquePhotos = new Map<string, string>();

  for (const file of files) {

    const basename = path
      .parse(file.name)
      .name
      .toLowerCase();

    const existing = uniquePhotos.get(basename);

    if (
      !existing ||
      getPriority(file.name) < getPriority(existing)
    ) {
      uniquePhotos.set(basename, file.name);
    }
  }

  /* TRI DES PHOTOGRAPHIES */

  const sortedPhotos = Array
    .from(uniquePhotos.values())
    .sort((a, b) => {

      const aCover = /^cover\./i.test(a);
      const bCover = /^cover\./i.test(b);

      if (aCover && !bCover) return -1;
      if (!aCover && bCover) return 1;

      return a.localeCompare(b, 'fr', {
        numeric: true,
        sensitivity: 'base',
      });
    });

  /* CREATION DE LA COLLECTION */

  if (sortedPhotos.length > 0) {

    collections[relative] = sortedPhotos.map(
      filename => createPhotoUrl(relative, filename)
    );

    console.log(
      '[BSN] Collection :',
      relative || 'Automotive',
      `— ${sortedPhotos.length} photographies`
    );
  }

  /* EXPLORATION DES SOUS-DOSSIERS */

  for (const entry of entries) {

    if (!entry.isDirectory()) continue;

    if (entry.name.startsWith('.')) continue;

    if (
      IGNORED_FOLDERS.includes(
        entry.name.toLowerCase()
      )
    ) {
      continue;
    }

    const nextDirectory = path.join(
      directory,
      entry.name
    );

    const nextRelative = relative
      ? `${relative}/${entry.name}`
      : entry.name;

    await scanDirectory(
      nextDirectory,
      nextRelative,
      collections
    );
  }
}

/* =========================================
   API GET
========================================= */

export async function GET() {

  const start = Date.now();

  const collections: Collections =
    Object.create(null);

  try {

    await scanDirectory(
      ROOT,
      '',
      collections
    );

    const totalCollections =
      Object.keys(collections).length;

    const totalPhotos = Object.values(
      collections
    ).reduce(
      (total, photos) => total + photos.length,
      0
    );

    console.log(
      '[BSN] Archives disponibles :',
      `${totalCollections} collections`,
      `${totalPhotos} photographies`,
      `— ${Date.now() - start} ms`
    );

    return NextResponse.json(collections, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {

    console.error(
      '[BSN] Gallery API Error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Impossible de charger les collections',
      },
      {
        status: 500,
      }
    );
  }
}
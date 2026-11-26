
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './automotive.module.css';

/* =========================================
   BSN — AUTOMOTIVE
========================================= */

type Collections = Record<string, string[]>;

type Gallery = {
  title: string;
  photos: string[];
  index: number;
};

const collectionNames: Record<string, string> = {
  carburacoeur: 'Carburacœur',
  orange: 'Orange',
  rasso: 'Rassemblement',
  veraison: 'Véraison',
  swiss: 'Swiss',
};

function formatName(name: string) {
  return (
    collectionNames[name.toLowerCase()] ||
    name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase())
  );
}

function getFilename(url: string) {
  if (url.startsWith('/api/raw?')) {
    return new URLSearchParams(
      url.split('?')[1]
    ).get('file') || '';
  }

  return decodeURIComponent(
    url.split('/').pop() || ''
  );
}

export default function Automotive() {

  const [menu, setMenu] = useState(false);

  const [collections, setCollections] =
    useState<Collections>({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  const [gallery, setGallery] =
    useState<Gallery | null>(null);

  const [expanded, setExpanded] =
    useState<Record<string, boolean>>({});

  /* =========================================
     CHARGEMENT DES COLLECTIONS
  ========================================= */

  useEffect(() => {
    const controller = new AbortController();

    async function loadCollections() {
      try {
        const response = await fetch('/api/photos', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Erreur API');
        }

        const data: Collections = await response.json();

        if (!controller.signal.aborted) {
          setCollections(data);
          setError(false);
        }

      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('[BSN]', error);
          setError(true);
        }

      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCollections();

    return () => controller.abort();
  }, []);

  /* =========================================
     GENERATION AUTOMATIQUE DES CHAPITRES
  ========================================= */

  const events = Object.keys(collections)
    .filter(id => collections[id].length > 0)
    .sort((a, b) =>
      a.localeCompare(b, 'fr', {
        numeric: true,
      })
    )
    .map(id => {
      const parts = id.split('/').filter(Boolean);

      return {
        id,

        title:
          parts.map(formatName).join(' — ') ||
          'Automotive',

        category:
          parts.length > 1
            ? formatName(parts[0])
            : 'Automotive photography',

        description:
          'Une collection photographique signée BSN.',

        photos: collections[id],
      };
    });

  const totalPhotos = events.reduce(
    (total, event) => total + event.photos.length,
    0
  );

  /* =========================================
     NAVIGATION GALERIE
  ========================================= */

  function navigatePhoto(direction: number) {
    setGallery(current => {
      if (!current) return null;

      return {
        ...current,
        index:
          (
            current.index +
            direction +
            current.photos.length
          ) % current.photos.length,
      };
    });
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setGallery(null);
        setMenu(false);
      }

      if (event.key === 'ArrowRight') {
        navigatePhoto(1);
      }

      if (event.key === 'ArrowLeft') {
        navigatePhoto(-1);
      }
    }

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const galleryOpen = gallery !== null;

  useEffect(() => {
    if (!galleryOpen) return;

    const previous = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [galleryOpen]);

  /* =========================================
     PAGE
  ========================================= */

  return (
    <>
      {/* HEADER */}

      <header>
        <Link className="logo" href="/">
          BSN<span>.</span>
        </Link>

        <nav className={menu ? 'open' : ''}>

          <Link
            href="/#work"
            onClick={() => setMenu(false)}
          >
            Projets
          </Link>

          <Link
            href="/#vision"
            onClick={() => setMenu(false)}
          >
            Vision
          </Link>

          <Link
            href="/#contact"
            onClick={() => setMenu(false)}
          >
            Contact
          </Link>

        </nav>

        <button
          className="menu"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
        >
          {menu ? 'Fermer' : 'Menu'}
        </button>

        <Link
          className="header-contact"
          href="/#contact"
        >
          Parlons création ↗
        </Link>
      </header>

      <main className={styles.page}>

        <div className={styles.container}>

          {/* INTRODUCTION */}

          <div className={styles.intro}>

            <Link
              href="/#work"
              className={styles.back}
            >
              <span>←</span>
              Retour au portfolio
            </Link>

            <div className={styles.eyebrow}>
              <span className={styles.dot} />
              BSN — PHOTOGRAPHIC ARCHIVES
            </div>

            <h1 className={styles.title}>
              Automotive<span>.</span>
            </h1>

            <div className={styles.introBottom}>

              <p>
                La culture automobile à travers mon objectif.
                Des événements, des rencontres et des
                instants capturés.
              </p>

              <span className={styles.reference}>
                COLLECTION / 01
              </span>

            </div>

          </div>

          {/* INFORMATIONS */}

          <div className={styles.archiveBar}>

            <span>
              {String(events.length).padStart(2, '0')}
              {' '}CHAPITRES
            </span>

            <span>
              {totalPhotos} PHOTOGRAPHIES
            </span>

          </div>

          {/* CHARGEMENT */}

          {loading && (
            <div className={styles.status}>
              <span className={styles.loader} />
              Chargement des collections...
            </div>
          )}

          {/* ERREUR */}

          {error && (
            <div className={styles.status}>
              Impossible de charger les collections.
            </div>
          )}

          {/* COLLECTION VIDE */}

          {!loading && !error && events.length === 0 && (
            <div className={styles.status}>
              Aucune photographie disponible.
            </div>
          )}

          {/* CHAPITRES AUTOMATIQUES */}

          {!loading && !error && events.map(
            (event, chapterIndex) => {

              const photos = event.photos;

              const cover =
                photos.find(photo =>
                  /^cover\./i.test(getFilename(photo))
                ) || photos[0];

              const visiblePhotos = expanded[event.id]
                ? photos
                : photos.slice(0, 12);

              return (
                <section
                  className={styles.chapter}
                  key={event.id}
                >

                  {/* NUMERO DU CHAPITRE */}

                  <div className={styles.chapterTop}>

                    <span>
                      CHAPTER{' '}
                      {String(chapterIndex + 1)
                        .padStart(2, '0')}
                    </span>

                    <span>{event.category}</span>

                  </div>

                  {/* COUVERTURE */}

                  <button
                    className={styles.cover}
                    aria-label={
                      `Découvrir ${event.title}`
                    }
                    onClick={() =>
                      setGallery({
                        title: event.title,
                        photos,
                        index: photos.indexOf(cover),
                      })
                    }
                  >

                    <img
                      src={cover}
                      alt={event.title}
                      loading={
                        chapterIndex === 0
                          ? 'eager'
                          : 'lazy'
                      }
                      decoding="async"
                    />

                    <span className={styles.coverTag}>
                      BSN / EVENT ARCHIVE
                    </span>

                    <span className={styles.coverArrow}>
                      ↗
                    </span>

                  </button>

                  {/* TITRE */}

                  <div className={styles.eventHeading}>

                    <div>

                      <h2>
                        {event.title}<span>.</span>
                      </h2>

                      <div className={styles.eventCount}>
                        {photos.length} PHOTOGRAPHIES
                      </div>

                    </div>

                    <p>{event.description}</p>

                  </div>

                  {/* PHOTOGRAPHIES */}

                  <div className={styles.gallery}>

                    {visiblePhotos.map((photo, index) => (

                      <button
                        key={photo}
                        className={styles.photo}
                        aria-label={
                          `Agrandir la photo ${index + 1}`
                        }
                        onClick={() =>
                          setGallery({
                            title: event.title,
                            photos,
                            index,
                          })
                        }
                      >

                        <img
                          src={photo}
                          alt={
                            `${event.title} — ${index + 1}`
                          }
                          loading="lazy"
                          decoding="async"
                        />

                        <span className={styles.photoNumber}>
                          {String(index + 1)
                            .padStart(2, '0')}
                        </span>

                        <span className={styles.photoArrow}>
                          ↗
                        </span>

                      </button>

                    ))}

                  </div>

                  {/* AFFICHER PLUS */}

                  {photos.length > 12 && (

                    <div className={styles.moreContainer}>

                      <button
                        className={styles.moreButton}
                        aria-expanded={!!expanded[event.id]}
                        onClick={() =>
                          setExpanded(current => ({
                            ...current,
                            [event.id]: !current[event.id],
                          }))
                        }
                      >
                        {expanded[event.id]
                          ? 'Réduire la collection −'
                          : `Voir les ${photos.length} photographies +`}
                      </button>

                    </div>

                  )}

                </section>
              );
            }
          )}

          {/* FIN DES COLLECTIONS */}

          <div className={styles.end}>

            <span>END OF COLLECTION</span>

            <Link href="/#work">
              Retour au portfolio ↗
            </Link>

          </div>

        </div>

      </main>

      {/* FOOTER */}

      <footer>

        <Link className="logo" href="/">
          BSN.
        </Link>

        <span>
          © {new Date().getFullYear()} BSN —
          Independent Creative Studio
        </span>

        <button
          className={styles.backTop}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            })
          }
        >
          Retour en haut ↑
        </button>

      </footer>

      {/* LIGHTBOX PLEIN ECRAN */}

      {gallery && (

        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={gallery.title}
          onClick={() => setGallery(null)}
        >

          <div
            className={styles.lightboxTop}
            onClick={event => event.stopPropagation()}
          >

            <div className={styles.lightboxTitle}>

              <strong>{gallery.title}</strong>

              <span>
                {gallery.index + 1} / {gallery.photos.length}
              </span>

            </div>

            <button
              autoFocus
              className={styles.close}
              onClick={() => setGallery(null)}
            >
              Fermer ×
            </button>

          </div>

          {/* PHOTO PRECEDENTE */}

          <button
            className={`${styles.lightboxNav} ${styles.prev}`}
            aria-label="Photo précédente"
            onClick={event => {
              event.stopPropagation();
              navigatePhoto(-1);
            }}
          >
            ←
          </button>

          {/* PHOTO */}

          <img
            className={styles.fullImage}
            src={gallery.photos[gallery.index]}
            alt={`${gallery.title} — ${gallery.index + 1}`}
            onClick={event => event.stopPropagation()}
          />

          {/* PHOTO SUIVANTE */}

          <button
            className={`${styles.lightboxNav} ${styles.next}`}
            aria-label="Photo suivante"
            onClick={event => {
              event.stopPropagation();
              navigatePhoto(1);
            }}
          >
            →
          </button>

          <div className={styles.lightboxBottom}>
            BSN — INDEPENDENT PHOTOGRAPHY
          </div>

        </div>

      )}

    </>
  );
}

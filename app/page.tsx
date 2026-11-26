
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const projects = [
  {
    title: 'Automotive',
    type: 'Culture automobile',
    image: '/automotive.jpg',
    href: '/automotive',
    description:
      'Une exploration visuelle de la passion automobile.',
  },
  {
    title: 'Motion',
    type: 'Création audiovisuelle',
    image: '/motion.jpg',
    href: '/motion',
    description:
      'Des histoires racontées par le mouvement, la lumière et le son.',
  },
];

export default function Home() {
  const [menu, setMenu] = useState(false);

  // Animations au défilement
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    document.querySelectorAll('.reveal').forEach(element => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Fermeture du menu avec Échap
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(false);
      }
    };

    window.addEventListener('keydown', close);

    return () => {
      window.removeEventListener('keydown', close);
    };
  }, []);

  return (
    <>
      {/* =================================
          HEADER
      ================================= */}

      <header>
        <a className="logo" href="#home">
          BSN<span>.</span>
        </a>

        <nav className={menu ? 'open' : ''}>
          {[
            ['Projets', 'work'],
            ['Vision', 'vision'],
            ['Contact', 'contact'],
          ].map(([label, id]) => (
            <a
              key={id}
              href={'#' + id}
              onClick={() => setMenu(false)}
            >
              {label}
            </a>
          ))}
        </nav>

        <button
          className="menu"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
        >
          {menu ? 'Fermer' : 'Menu'}
        </button>

        <a
          className="header-contact"
          href="#contact"
        >
          Parlons création ↗
        </a>
      </header>

      <main>

        {/* =================================
            HERO
        ================================= */}

        <section id="home" className="hero">

          <div className="hero-media" />

          <div className="hero-content">

            <div className="eyebrow">
              <i />
              STUDIO CRÉATIF INDÉPENDANT — FRANCE
            </div>

            <h1>
              Beyond
              <br />
              <em>the ordinary.</em>
            </h1>

            <div className="hero-bottom">

              <p>
                Culture automobile.
                <br />
                Création audiovisuelle. Vision indépendante.
              </p>

              <a
                className="circle"
                href="#work"
                aria-label="Découvrir les projets"
              >
                ↓
              </a>

            </div>

          </div>

          <span className="index">
            BSN / EST. INDEPENDENT
          </span>

        </section>

        {/* =================================
            PORTFOLIO
        ================================= */}

        <section id="work" className="section">

          <div className="section-label">
            01 / PORTFOLIO
          </div>

          <div className="section-heading reveal">

            <h2>
              Selected
              <br />
              <em>work.</em>
            </h2>

            <p>
              Une approche personnelle de l’image.
              <br />
              Des univers à découvrir.
            </p>

          </div>

          <div className="projects">

            {projects.map((project, index) => (

              <Link
                key={project.title}
                href={project.href}
                className="project reveal"
                aria-label={`Découvrir ${project.title}`}
              >

                <div
                  className={`project-image image-${index}`}
                  style={{
                    backgroundImage: `url(${project.image})`,
                  }}
                >

                  <span className="project-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="project-arrow">
                    ↗
                  </span>

                  <span className="image-word">
                    {project.title}
                  </span>

                </div>

                <div className="project-info">

                  <strong>
                    {project.title}
                  </strong>

                  <span>
                    {project.type}
                  </span>

                </div>

              </Link>

            ))}

          </div>

        </section>

        {/* =================================
            VISION
        ================================= */}

        <section
          id="vision"
          className="section vision"
        >

          <div className="section-label">
            02 / THE VISION
          </div>

          <h2 className="reveal">
            One vision.
            <br />
            <em>No compromise.</em>
          </h2>

          <div className="vision-text reveal">

            <p>
              BSN est mon projet créatif indépendant.
              Un espace pour explorer la culture
              automobile et raconter des histoires
              à travers l’image.
            </p>

            <p>
              Mon ambition : créer des images qui
              transmettent une émotion, avec une
              attention particulière portée à la
              lumière, au mouvement et à chaque détail.
            </p>

          </div>

        </section>

        {/* =================================
            CONTACT
        ================================= */}

        <section
          id="contact"
          className="section contact"
        >

          <div className="section-label">
            03 / CONTACT
          </div>

          <h2 className="reveal">
            Let's create
            <br />
            <em>something.</em>
          </h2>

          <p>
            Pour une collaboration ou un projet audiovisuel.
          </p>

          <a
            className="contact-link"
            href="mailto:corybesson14@icloud.com"
          >
            Prendre contact ↗
          </a>

        </section>

      </main>

      {/* =================================
          FOOTER
      ================================= */}

      <footer>

        <a className="logo" href="#home">
          BSN.
        </a>

        <span>
          © {new Date().getFullYear()} BSN —
          Independent Creative Studio
        </span>

        <a href="#home">
          Retour en haut ↑
        </a>

      </footer>
    </>
  );
}

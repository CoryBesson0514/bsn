import Link from 'next/link';

export default function MotionPage() {
  return (
    <main className="hero">
      <div
        className="hero-media"
        aria-hidden="true"
        style={{
          backgroundImage: "linear-gradient(0deg, var(--bg), transparent 85%), url('/motion.jpg')",
        }}
      />
      <div className="hero-content">
        <Link href="/#work">← Retour aux projets</Link>
        <h1>Motion</h1>
        <p>Les projets audiovisuels seront présentés ici.</p>
      </div>
    </main>
  );
}

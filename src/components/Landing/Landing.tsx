import Link from "next/link";
import CatalogueCarousel from "@/components/CatalogueCarousel/CatalogueCarousel";
import FeatureGrid from "@/components/FeatureGrid/FeatureGrid";
import Steps from "@/components/Steps/Steps";
import type { Film } from "@/data/types";
import { collapseSeries } from "@/lib/series";
import styles from "./Landing.module.css";

const FLOATERS = [
  { top: "10%", left: "6%", size: 50, dur: "17s", delay: "0s", dx: "150px", dy: "-90px", rot: "25deg" },
  { top: "74%", left: "12%", size: 36, dur: "14s", delay: "-4s", dx: "-110px", dy: "100px", rot: "-20deg" },
  { top: "20%", left: "84%", size: 42, dur: "20s", delay: "-9s", dx: "-130px", dy: "80px", rot: "30deg" },
  { top: "82%", left: "80%", size: 32, dur: "15s", delay: "-2s", dx: "95px", dy: "-120px", rot: "-28deg" },
  { top: "6%", left: "48%", size: 28, dur: "13s", delay: "-7s", dx: "80px", dy: "100px", rot: "22deg" },
  { top: "88%", left: "46%", size: 38, dur: "18s", delay: "-12s", dx: "-100px", dy: "-75px", rot: "-24deg" },
  { top: "42%", left: "3%", size: 26, dur: "14.5s", delay: "-5s", dx: "110px", dy: "70px", rot: "20deg" },
  { top: "38%", left: "94%", size: 30, dur: "16s", delay: "-10s", dx: "-90px", dy: "-100px", rot: "-22deg" },
];

const features = [
  {
    title: "Courts-métrages indépendants",
    description: "Un catalogue d'animations 2D et 3D créées par des artistes indépendants, introuvables ailleurs.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 18v3" />
      </svg>
    ),
  },
  {
    title: "Gratuit, même sans compte",
    description: "Le catalogue et la lecture sont ouverts à tous. Crée un compte gratuit pour noter, commenter et sauvegarder tes favoris.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6z" />
      </svg>
    ),
  },
  {
    title: "Soutiens les artistes",
    description: "Chaque vue aide des créateurs indépendants à continuer de produire.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14.2c2.9.6 5 2.7 5 5.8" />
      </svg>
    ),
  },
];

const steps = [
  { title: "Explore le catalogue", description: "Parcours librement les films et séries par catégorie, sans même créer de compte." },
  { title: "Regarde en illimité", description: "Lance n'importe quel film ou série, sans limite et sans publicité." },
  { title: "Crée un compte (optionnel)", description: "Pour noter, commenter et sauvegarder tes favoris, inscris-toi gratuitement en quelques secondes." },
];

export default function Landing({ films }: { films: Film[] }) {
  const catalogue = collapseSeries(films);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.floaters}>
          {FLOATERS.map((f, i) => (
            <span
              key={i}
              className={styles.floater}
              style={
                {
                  top: f.top,
                  left: f.left,
                  width: f.size,
                  height: f.size,
                  animationDuration: f.dur,
                  animationDelay: f.delay,
                  "--float-dx": f.dx,
                  "--float-dy": f.dy,
                  "--float-rot": f.rot,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className={styles.heroInner}>
          <h1 className={styles.title}>ZorAnim</h1>
          <p className={styles.subtitle}>
            Le catalogue de courts-métrages et séries d&apos;animation 2D et 3D créés par des artistes
            indépendants. Navigation et lecture libres, sans compte.
          </p>
          <div className={styles.actions}>
            <Link href="/catalogue" className={styles.primaryCta}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Parcourir le catalogue
            </Link>
            <Link href="/inscription" className={styles.secondaryCta}>
              Créer un compte
            </Link>
            <Link href="/connexion" className={styles.secondaryCta}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {catalogue.length > 0 && (
        <section className={`${styles.section} ${styles.carouselSection}`}>
          <span className={styles.eyebrow}>Le catalogue</span>
          <h2 className={styles.sectionTitle}>Un aperçu de ce qui t&apos;attend</h2>
          <CatalogueCarousel films={catalogue} />
        </section>
      )}

      <section className={`${styles.section} ${styles.featuresSection}`}>
        <span className={styles.eyebrow}>Pourquoi ZorAnim</span>
        <h2 className={styles.sectionTitle}>Pensé pour les artistes et pour toi</h2>
        <FeatureGrid features={features} />
      </section>

      <section className={styles.section}>
        <span className={styles.eyebrow}>3 étapes</span>
        <h2 className={styles.sectionTitle}>Comment ça marche</h2>
        <div className={styles.stepsWrap}>
          <Steps steps={steps} />
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <div className={styles.ctaGlow} />
        <div className={styles.ctaLogo}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <h2 className={styles.ctaTitle}>Prêt à découvrir des pépites d&apos;animation ?</h2>
        <p className={styles.ctaSubtitle}>Sans carte bancaire, sans engagement, sans pub.</p>
        <div className={styles.actions}>
          <Link href="/catalogue" className={styles.secondaryCta}>
            Parcourir sans compte
          </Link>
          <Link href="/inscription" className={styles.primaryCta}>
            Créer un compte gratuitement
          </Link>
        </div>
      </section>
    </main>
  );
}

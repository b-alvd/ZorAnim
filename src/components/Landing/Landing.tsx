import Link from "next/link";
import Image from "next/image";
import FeatureGrid from "@/components/FeatureGrid/FeatureGrid";
import Steps from "@/components/Steps/Steps";
import type { Film } from "@/data/types";
import { collapseSeries } from "@/lib/series";
import styles from "./Landing.module.css";

const features = [
  {
    title: "Courts-métrages indépendants",
    description: "Un catalogue d'animations 2D créées par des artistes indépendants, introuvables ailleurs.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 18v3" />
      </svg>
    ),
  },
  {
    title: "Gratuit",
    description: "Pas d'abonnement, pas de carte bancaire : crée un compte et regarde librement.",
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
  { title: "Crée un compte", description: "Inscris-toi gratuitement en quelques secondes, aucune carte bancaire requise." },
  { title: "Explore le catalogue", description: "Parcours les films par catégorie, découvre de nouveaux artistes chaque semaine." },
  { title: "Regarde en illimité", description: "Accède à tous les courts-métrages, sans limite et sans publicité." },
];

export default function Landing({ films }: { films: Film[] }) {
  const teaser = collapseSeries(films).slice(0, 8);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.title}>ZorAnim</h1>
          <p className={styles.subtitle}>
            Le catalogue de courts-métrages d&apos;animation 2D créés par des artistes indépendants.
          </p>
          <div className={styles.actions}>
            <Link href="/inscription" className={styles.primaryCta}>
              Créer un compte
            </Link>
            <Link href="/connexion" className={styles.secondaryCta}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {teaser.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Un aperçu du catalogue</h2>
          <div className={styles.teaserGrid}>
            {teaser.map((f) => (
              <div key={f.id} className={styles.teaserPoster}>
                <Image src={f.poster} alt={f.title} fill sizes="200px" unoptimized />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={`${styles.section} ${styles.featuresSection}`}>
        <FeatureGrid features={features} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Comment ça marche</h2>
        <div className={styles.stepsWrap}>
          <Steps steps={steps} />
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>Prêt à découvrir des pépites d&apos;animation ?</h2>
        <Link href="/inscription" className={styles.primaryCta}>
          Créer un compte gratuitement
        </Link>
      </section>
    </main>
  );
}

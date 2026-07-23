import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import FeatureGrid from "@/components/FeatureGrid/FeatureGrid";
import Steps from "@/components/Steps/Steps";
import styles from "./community.module.css";

const features = [
  {
    title: "Visibilité",
    description: "Ton film mis en avant sur le catalogue, les catégories et la page d'accueil.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "Communauté",
    description: "Rejoins d'autres artistes indépendants de l'animation 2D.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14.2c2.9.6 5 2.7 5 5.8" />
      </svg>
    ),
  },
  {
    title: "Simplicité",
    description: "Pas de frais, pas de contrat compliqué : on s'occupe du reste.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6z" />
      </svg>
    ),
  },
];

const steps = [
  {
    title: "Présente-toi",
    description: "Écris-nous via la page Contact pour te présenter, toi et ton travail.",
  },
  {
    title: "Ta page artiste",
    description: "On crée ta fiche avec tes films, ta bio et un lien vers ton travail.",
  },
  {
    title: "Publie tes films",
    description: "Tu nous envoies tes courts-métrages au fil de l'eau, on s'occupe du reste.",
  },
];

export default function DevenirArtistePage() {
  return (
    <InfoPage
      title="Devenir artiste"
      subtitle="ZorAnim est construit pour et par les artistes indépendants de l'animation 2D."
    >
      <FeatureGrid features={features} />

      <h2>Comment ça marche</h2>
      <Steps steps={steps} />

      <div className={styles.ctaBlock}>
        <Link href="/contact" className={styles.cta}>
          Rejoindre ZorAnim
        </Link>
      </div>
    </InfoPage>
  );
}

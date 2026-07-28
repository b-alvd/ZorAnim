import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import FeatureGrid from "@/components/FeatureGrid/FeatureGrid";
import Steps from "@/components/Steps/Steps";
import { getArtistByUserId } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import CreateStudioForm from "./CreateStudioForm";
import styles from "../devenir-artiste/community.module.css";

const features = [
  {
    title: "Travaillez ensemble",
    description: "Regroupe plusieurs artistes sous une même fiche pour soumettre vos films en commun.",
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
    title: "Invite qui tu veux",
    description: "Invite d'autres artistes déjà présents sur ZorAnim à rejoindre ton studio.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      </svg>
    ),
  },
  {
    title: "Une fiche commune",
    description: "Le studio a sa propre page, ses propres films, visible par tous.",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 18v3" />
      </svg>
    ),
  },
];

const steps = [
  {
    title: "Sois déjà artiste",
    description: "Il faut avoir un profil artiste personnel accepté sur ZorAnim avant de créer un studio.",
  },
  {
    title: "Crée ton studio",
    description: "Donne-lui un nom, une bio et un avatar.",
  },
  {
    title: "Invite des artistes",
    description: "Depuis ton profil, invite d'autres artistes à rejoindre le studio.",
  },
];

export default async function CreerUnStudioPage() {
  const user = await getCurrentUser();
  const personalArtist = user ? await getArtistByUserId(user.id) : null;

  return (
    <InfoPage
      title="Créer un studio"
      subtitle="Regroupe plusieurs artistes sous une même fiche et soumettez vos films ensemble."
    >
      <FeatureGrid features={features} />

      <h2>Comment ça marche</h2>
      <Steps steps={steps} />

      {!user ? (
        <div className={styles.success}>
          <p className={styles.successTitle}>Connexion requise</p>
          <p className={styles.successText}>Tu dois être connecté pour créer un studio.</p>
          <Link href="/connexion" className={styles.loginCta}>
            Se connecter
          </Link>
        </div>
      ) : !personalArtist ? (
        <div className={styles.success}>
          <p className={styles.successTitle}>Tu dois être artiste</p>
          <p className={styles.successText}>
            Il faut d&apos;abord avoir un profil artiste personnel accepté pour créer un studio.
          </p>
          <Link href="/devenir-artiste" className={styles.loginCta}>
            Devenir artiste
          </Link>
        </div>
      ) : (
        <CreateStudioForm />
      )}
    </InfoPage>
  );
}

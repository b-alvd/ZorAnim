import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import Steps from "@/components/Steps/Steps";
import { getCategories } from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import { getCurrentUser } from "@/lib/auth/current-user";
import SubmitFilmForm from "./SubmitFilmForm";
import styles from "../devenir-artiste/community.module.css";

const steps = [
  {
    title: "Prépare ton film",
    description: "Un court-métrage d'animation 2D terminé, avec une affiche et un résumé courts.",
  },
  {
    title: "Contacte-nous",
    description:
      "Écris-nous via la page Contact avec un lien de visionnage et quelques informations sur toi.",
  },
  {
    title: "On regarde ensemble",
    description: "On visionne ton film et on revient vers toi avec un retour, sous quelques jours.",
  },
  {
    title: "Mise en ligne",
    description: "Si c'est un match, ton film rejoint le catalogue ZorAnim avec ta fiche artiste.",
  },
];

export default async function SoumettreFilmPage() {
  const [categories, user] = await Promise.all([getCategories().then(mergeCategories), getCurrentUser()]);

  return (
    <InfoPage
      title="Soumettre un film"
      subtitle="Remplis le formulaire ci-dessous, on regarde ta soumission et on revient vers toi."
    >
      <Steps steps={steps} />

      <h2>Ce qu&apos;il te faut</h2>
      <ul>
        <li>Un lien vers le fichier vidéo de ton court-métrage</li>
        <li>Un lien vers une affiche (image de couverture)</li>
        <li>Un résumé de quelques phrases</li>
        <li>Ton nom ou celui de ton studio</li>
      </ul>

      {user ? (
        <SubmitFilmForm categories={categories} />
      ) : (
        <div className={styles.success}>
          <p className={styles.successTitle}>Connexion requise</p>
          <p className={styles.successText}>Tu dois être connecté pour soumettre un film.</p>
          <Link href="/connexion" className={styles.loginCta}>
            Se connecter
          </Link>
        </div>
      )}
    </InfoPage>
  );
}

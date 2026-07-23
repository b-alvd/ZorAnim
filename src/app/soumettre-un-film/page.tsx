import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import Steps from "@/components/Steps/Steps";
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

export default function SoumettreFilmPage() {
  return (
    <InfoPage
      title="Soumettre un film"
      subtitle="Le formulaire de soumission en ligne arrive bientôt. En attendant, voici comment ça se passe."
    >
      <Steps steps={steps} />

      <h2>Ce qu&apos;il te faut</h2>
      <ul>
        <li>Le fichier vidéo de ton court-métrage, dans un format courant</li>
        <li>Une affiche (image de couverture)</li>
        <li>Un résumé de quelques phrases</li>
        <li>Ton nom ou celui de ton studio</li>
      </ul>

      <div className={styles.ctaBlock}>
        <Link href="/contact" className={styles.cta}>
          Proposer mon film
        </Link>
      </div>
    </InfoPage>
  );
}

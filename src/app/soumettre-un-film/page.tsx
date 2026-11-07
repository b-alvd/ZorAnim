import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import Steps from "@/components/Steps/Steps";
import { getUserIdentities } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "../devenir-artiste/community.module.css";

const steps = [
  {
    title: "Crée ton profil d'artiste",
    description:
      "Seuls les artistes et les membres d'un studio peuvent proposer un contenu. Si ce n'est pas encore fait, présente-toi depuis « Devenir artiste ».",
  },
  {
    title: "Prépare tes fichiers",
    description: "La vidéo de ton film (ou de chaque épisode), une affiche et un synopsis de quelques phrases.",
  },
  {
    title: "Propose-le depuis ton Espace créateur",
    description:
      "Bouton « Proposer un contenu » : choisis un film ou une série, ajoute tes fichiers et indique comment tu veux qu'il sorte.",
  },
  {
    title: "Choisis ta sortie",
    description:
      "Dès que possible, à une date précise, ou en avant-première : une diffusion en direct où tout le monde regarde en même temps.",
  },
  {
    title: "L'équipe valide",
    description:
      "On regarde ta proposition et on peut ajuster les informations ou la date avant de la publier. Tu es prévenu par une notification.",
  },
];

// Explains how to propose a film or a series; the form itself lives in the
// creator space ("Proposer un contenu").
export default async function SoumettreFilmPage() {
  const user = await getCurrentUser();
  const identities = user ? await getUserIdentities(user.id) : [];

  return (
    <InfoPage
      title="Proposer un film ou une série"
      subtitle="Publie tes animations sur ZorAnim, en ligne tout de suite, à la date de ton choix ou en avant-première."
    >
      <Steps steps={steps} />

      <h2>Ce qu&apos;il te faut</h2>
      <ul>
        <li>La vidéo de ton film, ou de chaque épisode pour une série (jusqu&apos;à 100 Mo par fichier)</li>
        <li>Une affiche (image de couverture), de préférence au format paysage</li>
        <li>Un synopsis de quelques phrases, la catégorie et la classification par âge</li>
      </ul>

      <h2>Les types de sortie</h2>
      <ul>
        <li>
          <strong>Dès que possible</strong> : ton contenu est en ligne dès que l&apos;équipe l&apos;accepte.
        </li>
        <li>
          <strong>Date de sortie</strong> : il apparaît dans « Bientôt sur ZorAnim » puis sort tout seul au jour et à
          l&apos;heure choisis.
        </li>
        <li>
          <strong>Avant-première</strong> : une diffusion en direct mise en avant sur l&apos;accueil, avec compte à
          rebours, salle d&apos;attente et compteur de spectateurs. Tu peux ajouter une date de sortie officielle
          après le direct.
        </li>
      </ul>

      <div className={styles.success}>
        {!user ? (
          <>
            <p className={styles.successTitle}>Connexion requise</p>
            <p className={styles.successText}>Connecte-toi pour proposer un film ou une série.</p>
            <Link href="/connexion" className={styles.loginCta}>
              Se connecter
            </Link>
          </>
        ) : identities.length === 0 ? (
          <>
            <p className={styles.successTitle}>Commence par devenir artiste</p>
            <p className={styles.successText}>
              Une fois ton profil d&apos;artiste validé, tu pourras proposer tes contenus depuis ton Espace créateur.
            </p>
            <Link href="/devenir-artiste" className={styles.loginCta}>
              Devenir artiste
            </Link>
          </>
        ) : (
          <>
            <p className={styles.successTitle}>Prêt à proposer ?</p>
            <p className={styles.successText}>
              Le formulaire est dans ton Espace créateur, où tu suis aussi tes propositions en attente.
            </p>
            <Link href="/mon-espace?proposer=1" className={styles.loginCta}>
              Proposer un contenu
            </Link>
          </>
        )}
      </div>
    </InfoPage>
  );
}

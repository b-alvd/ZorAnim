import Link from "next/link";
import HelpCenter from "@/components/HelpCenter/HelpCenter";
import HelpFaq, { type FaqGroup } from "./HelpFaq";
import styles from "./aide.module.css";

export const metadata = {
  title: "Aide | ZorAnim",
};

const groups: FaqGroup[] = [
  {
    title: "Regarder",
    items: [
      {
        question: "Faut-il un compte pour regarder ?",
        answer:
          "Non : le catalogue et la lecture sont ouverts à tous. Un compte gratuit permet en plus de garder ta liste, de reprendre là où tu t'étais arrêté, de noter et de commenter.",
      },
      {
        question: "Comment reprendre un film ou une série là où je me suis arrêté ?",
        answer:
          "Connecté, ta position est enregistrée automatiquement. Sur l'accueil, la ligne « Reprendre » te propose de continuer un film ou un épisode en cours, ou l'épisode suivant si tu as fini le précédent.",
      },
      {
        question: "Qu'est-ce qu'une avant-première ?",
        answer:
          "Une diffusion en direct : tout le monde regarde en même temps, avec un compteur de spectateurs. Elle est annoncée sur l'accueil avec un compte à rebours et une salle d'attente. Après le direct, le contenu sort officiellement, tout de suite ou à la date prévue.",
      },
      {
        question: "Que signifie « Bientôt sur ZorAnim » ?",
        answer:
          "Ce sont les contenus annoncés ou programmés : tu peux voir leur fiche et leurs bandes-annonces, et les ajouter à ta liste pour ne pas les rater à leur sortie.",
      },
      {
        question: "Sur quels appareils puis-je utiliser ZorAnim ?",
        answer: "Ordinateur, tablette et mobile, directement depuis ton navigateur, sans rien installer.",
      },
    ],
  },
  {
    title: "Mon compte",
    items: [
      {
        question: "Le site est-il gratuit ?",
        answer: "Oui, entièrement, création de compte comprise. Aucune information de paiement n'est demandée.",
      },
      {
        question: "Où retrouver ma liste et mon historique ?",
        answer:
          "« Ma liste » est dans la barre du haut. Ton historique, tes statistiques et tes réglages sont dans ton profil, accessible depuis le menu de ton compte.",
      },
      {
        question: "Comment changer mon pseudo, mon email ou mon mot de passe ?",
        answer:
          "Dans ton profil, onglet « Compte ». Le pseudo peut être modifié tous les 3 jours ; ton mot de passe actuel est demandé pour changer d'email.",
      },
      {
        question: "Comment supprimer mon compte ?",
        answer:
          "Dans ton profil, onglet « Compte », tout en bas. La suppression est définitive : ta liste, ton historique et tes avis sont effacés.",
      },
    ],
  },
  {
    title: "Créer sur ZorAnim",
    items: [
      {
        question: "Comment devenir artiste ?",
        answer:
          "Présente-toi depuis la page « Devenir artiste ». Une fois ta candidature acceptée, ton Espace créateur s'ouvre : tu peux y proposer tes films et séries et suivre leurs vues.",
      },
      {
        question: "Comment proposer un film ou une série ?",
        answer:
          "Depuis ton Espace créateur, bouton « Proposer un contenu ». Choisis la sortie : dès que possible, à une date précise, en avant-première, ou en simple annonce si la vidéo n'est pas encore prête. L'équipe vérifie chaque proposition avant sa sortie.",
      },
      {
        question: "Qu'est-ce qu'un studio ?",
        answer:
          "Un studio regroupe plusieurs artistes sous un même nom. Un artiste peut en créer un et y inviter d'autres artistes ; on peut aussi demander à rejoindre un studio depuis sa page.",
      },
      {
        question: "Où sont hébergés les fichiers que j'envoie ?",
        answer:
          "Les images et vidéos (affiches, films, avatars, bannières) sont hébergées chez Cloudinary, un prestataire spécialisé.",
      },
    ],
  },
  {
    title: "Un souci ?",
    items: [
      {
        question: "Comment contacter l'équipe ?",
        answer:
          "Depuis la page Contact (connexion requise). Ton message et la réponse de l'équipe restent visibles dans ton profil.",
      },
      {
        question: "J'ai trouvé un bug, que faire ?",
        answer:
          "Écris-nous depuis la page Contact avec le sujet « Bug ou problème technique », en précisant la page, le contenu et ton navigateur si possible.",
      },
    ],
  },
];

const shortcuts = [
  {
    href: "/contact",
    title: "Écrire à l'équipe",
    text: "Une question, un bug, une idée",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/devenir-artiste",
    title: "Devenir artiste",
    text: "Publie tes animations",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
    ),
  },
  {
    href: "/soumettre-un-film",
    title: "Proposer un contenu",
    text: "Film, série, avant-première",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M10 9.5v5l4-2.5z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/mises-a-jour",
    title: "Nouveautés du site",
    text: "Ce qui a changé récemment",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6z" />
      </svg>
    ),
  },
];

export default function AidePage() {
  return (
    <HelpCenter active="aide" title="Comment peut-on t'aider ?" subtitle="Les réponses aux questions les plus fréquentes sur ZorAnim.">
      <div className={styles.shortcuts}>
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} className={styles.shortcut}>
            <span className={styles.shortcutIcon}>{s.icon}</span>
            <span>
              <strong>{s.title}</strong>
              <span className={styles.shortcutText}>{s.text}</span>
            </span>
          </Link>
        ))}
      </div>

      <HelpFaq groups={groups} />

      <div className={styles.cta}>
        <div>
          <strong>Tu n&apos;as pas trouvé ta réponse ?</strong>
          <p>L&apos;équipe te répond en général sous 2 à 3 jours ouvrés.</p>
        </div>
        <Link href="/contact" className={styles.ctaBtn}>
          Nous écrire
        </Link>
      </div>
    </HelpCenter>
  );
}

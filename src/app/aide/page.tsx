import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import Faq from "@/components/Faq/Faq";

const faqItems = [
  {
    question: "Faut-il un compte pour regarder des films ou des séries ?",
    answer:
      "Oui. Il faut créer un compte gratuit pour parcourir le catalogue et lancer la lecture d'un film ou d'une série. Sans compte, tu ne vois que la page d'accueil publique.",
  },
  {
    question: "Comment regarder un film ou une série ?",
    answer:
      "Une fois connecté, parcours le catalogue ou les nouveautés, clique sur une affiche pour voir sa fiche, puis sur « Lecture » pour lancer la vidéo.",
  },
  {
    question: "Le site est-il gratuit ?",
    answer: "Oui, ZorAnim est en accès libre et gratuit, création de compte comprise.",
  },
  {
    question: "Comment ajouter un film ou une série à ma liste ou retrouver ce que j'ai déjà vu ?",
    answer:
      "Depuis la fiche d'un film ou d'une série, clique sur « Ajouter à ma liste ». Retrouve ensuite tes films et séries dans « Ma liste » et l'historique de tout ce que tu as regardé dans « Historique », tous deux accessibles depuis ton profil.",
  },
  {
    question: "Comment devenir artiste sur ZorAnim ?",
    answer:
      "Rends-toi sur la page « Devenir artiste » et présente-toi. Une fois ta candidature acceptée, tu peux soumettre des films ou des séries et créer un studio.",
  },
  {
    question: "Qu'est-ce qu'un studio ?",
    answer:
      "Un studio regroupe plusieurs artistes sous une même fiche. Seul un artiste déjà accepté peut en créer un, depuis la page « Créer un studio », puis inviter d'autres artistes à le rejoindre depuis son profil.",
  },
  {
    question: "Puis-je proposer mon propre court-métrage ?",
    answer:
      "Oui, si tu es artiste (ou membre d'un studio). Rends-toi sur « Soumettre un film ou une série », choisis l'identité (ton nom d'artiste ou un studio) sous laquelle le contenu sera publié, et envoie ta demande. On te tient au courant depuis ton profil.",
  },
  {
    question: "Où sont hébergées les images et vidéos que j'envoie ?",
    answer:
      "Les fichiers envoyés (posters, vidéos, avatars) sont hébergés chez Cloudinary, un prestataire tiers spécialisé et sécurisé.",
  },
  {
    question: "Comment contacter l'équipe ?",
    answer:
      "Via la page Contact (connexion requise). Ton message et notre réponse restent visibles dans la section « Mes messages » de ton profil.",
  },
  {
    question: "Sur quels appareils puis-je utiliser ZorAnim ?",
    answer: "Le site fonctionne sur ordinateur, tablette et mobile, directement depuis ton navigateur, sans installation.",
  },
  {
    question: "J'ai trouvé un bug, que faire ?",
    answer: "Décris-nous le problème via la page Contact, avec le film ou la série et le navigateur concernés si possible.",
  },
];

export default function AidePage() {
  return (
    <InfoPage title="Aide" subtitle="Tout ce qu'il faut savoir pour profiter de ZorAnim.">
      <Faq items={faqItems} />
      <p>
        Une question qui n&apos;est pas listée ici ?{" "}
        <Link href="/contact" style={{ color: "var(--accent, #e50914)", textDecoration: "underline" }}>
          Écris-nous
        </Link>
        , on te répond directement.
      </p>
    </InfoPage>
  );
}

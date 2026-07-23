import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import Faq from "@/components/Faq/Faq";

const faqItems = [
  {
    question: "Comment regarder un film ?",
    answer:
      "Parcours le catalogue ou les nouveautés, clique sur une affiche pour voir sa fiche, puis sur « Lecture » pour lancer la vidéo en plein écran.",
  },
  {
    question: "Le site est-il gratuit ?",
    answer:
      "Oui, ZorAnim est actuellement en accès libre et gratuit.",
  },
  {
    question: "Puis-je proposer mon propre court-métrage ?",
    answer:
      "Bien sûr ! Rends-toi sur la page « Soumettre un film » pour connaître les prochaines étapes.",
  },
  {
    question: "Sur quels appareils puis-je utiliser ZorAnim ?",
    answer:
      "Le site fonctionne sur ordinateur, tablette et mobile, directement depuis ton navigateur, sans installation.",
  },
  {
    question: "Comment retrouver un film que j'ai déjà vu ?",
    answer:
      "Utilise le catalogue ou les catégories pour naviguer par thème ; une fonctionnalité « Ma liste » arrivera prochainement.",
  },
  {
    question: "J'ai trouvé un bug, que faire ?",
    answer:
      "Décris-nous le problème via la page Contact, avec le film et le navigateur concernés si possible.",
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

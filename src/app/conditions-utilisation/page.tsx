import Link from "next/link";
import HelpCenter, { LegalSection, Summary } from "@/components/HelpCenter/HelpCenter";

export const metadata = {
  title: "Conditions d'utilisation | ZorAnim",
};

const SECTIONS = [
  { id: "objet", label: "Objet" },
  { id: "acces", label: "Accès et compte" },
  { id: "createurs", label: "Artistes et studios" },
  { id: "propositions", label: "Proposer un contenu" },
  { id: "propriete", label: "Propriété intellectuelle" },
  { id: "comportement", label: "Comportement" },
  { id: "moderation", label: "Modération" },
  { id: "disponibilite", label: "Disponibilité" },
  { id: "evolution", label: "Évolution des conditions" },
  { id: "contact", label: "Contact" },
];

export default function ConditionsPage() {
  return (
    <HelpCenter
      active="conditions"
      title="Conditions d'utilisation"
      subtitle="Les règles qui encadrent l'utilisation de ZorAnim, pour les spectateurs comme pour les créateurs."
      updated="7 novembre 2026"
      toc={SECTIONS}
    >
      <Summary
        items={[
          "ZorAnim est gratuit et le catalogue se regarde sans compte.",
          "Un compte permet de suivre sa progression, garder une liste, noter et commenter.",
          "Chaque contenu proposé est vérifié par l'équipe avant d'être publié.",
          "Les œuvres restent la propriété de leurs artistes et studios.",
          "Le respect des autres est obligatoire : l'équipe peut bannir un compte.",
        ]}
      />

      <LegalSection id="objet" number={1} title="Objet">
        <p>
          ZorAnim est une plateforme de streaming dédiée aux films et séries d&apos;animation 2D et 3D
          réalisés par des artistes et studios indépendants. Utiliser le site implique
          d&apos;accepter les présentes conditions.
        </p>
      </LegalSection>

      <LegalSection id="acces" number={2} title="Accès et compte">
        <p>
          Le service est gratuit et ne demande aucune information de paiement. Le catalogue peut être
          parcouru et regardé sans compte. Créer un compte permet en plus de reprendre un programme là
          où tu l&apos;as laissé, de gérer ta liste, de noter, de commenter, de nous écrire et de
          devenir créateur.
        </p>
        <p>
          Tu es responsable de la confidentialité de ton mot de passe et de l&apos;activité effectuée
          depuis ton compte. Tu peux supprimer ton compte à tout moment depuis ton profil.
        </p>
      </LegalSection>

      <LegalSection id="createurs" number={3} title="Artistes et studios">
        <p>
          Tout utilisateur peut candidater pour devenir artiste. Une fois accepté par l&apos;équipe,
          un artiste dispose d&apos;un Espace créateur pour gérer sa page (avatar, bannière, bio) et
          proposer des contenus. Il peut aussi créer un studio ou en rejoindre un.
        </p>
        <p>
          Le propriétaire d&apos;un studio est responsable des invitations qu&apos;il envoie, des
          demandes qu&apos;il accepte et des contenus proposés au nom du studio.
        </p>
      </LegalSection>

      <LegalSection id="propositions" number={4} title="Proposer un contenu">
        <p>
          En proposant un film, une série, un épisode ou une annonce, tu garantis détenir les droits
          nécessaires sur tout ce que tu envoies (vidéo, poster, bannière, bandes-annonces) et
          n&apos;y inclure aucun contenu illicite ou portant atteinte aux droits d&apos;un tiers.
        </p>
        <p>
          Tu peux indiquer comment tu souhaites que ton contenu sorte : tout de suite, à une date
          précise, en avant-première ou sous forme d&apos;annonce. Il s&apos;agit d&apos;une demande :
          l&apos;équipe examine chaque proposition et peut l&apos;accepter, ajuster ses paramètres de
          sortie ou la refuser. Une annonce ne publie que la fiche ; la vidéo ajoutée ensuite passe
          elle aussi par une validation.
        </p>
      </LegalSection>

      <LegalSection id="propriete" number={5} title="Propriété intellectuelle">
        <p>
          Chaque film ou série reste la propriété exclusive de son artiste ou studio. En le proposant,
          tu autorises ZorAnim à le diffuser sur le site et à utiliser ses visuels pour le mettre en
          avant (accueil, nouveautés, avant-premières). Tu peux demander son retrait à tout moment.
        </p>
        <p>
          Toute reproduction, diffusion ou réutilisation en dehors de ZorAnim nécessite l&apos;accord
          préalable de l&apos;ayant droit.
        </p>
      </LegalSection>

      <LegalSection id="comportement" number={6} title="Comportement">
        <ul>
          <li>Respecter les artistes et les autres spectateurs, notamment dans les commentaires.</li>
          <li>Ne pas publier de propos haineux, harcelants, ou de spoils sans prévenir.</li>
          <li>Ne pas tenter de contourner les protections techniques du site ou les limites d&apos;envoi.</li>
          <li>Ne pas usurper l&apos;identité d&apos;un autre artiste, d&apos;un studio ou de l&apos;équipe.</li>
          <li>Ne pas utiliser le site à des fins commerciales non autorisées.</li>
        </ul>
      </LegalSection>

      <LegalSection id="moderation" number={7} title="Modération">
        <p>
          L&apos;équipe peut supprimer un commentaire, retirer un contenu ou bannir un compte qui ne
          respecte pas ces conditions. Un compte banni peut envoyer une demande de déban pour expliquer
          sa situation.
        </p>
      </LegalSection>

      <LegalSection id="disponibilite" number={8} title="Disponibilité">
        <p>
          ZorAnim est fourni « en l&apos;état ». Le site étant en développement actif, certaines
          fonctionnalités peuvent évoluer, être temporairement indisponibles (maintenance) ou modifiées
          sans préavis. Les changements notables sont listés sur la page{" "}
          <Link href="/mises-a-jour">Mises à jour</Link>.
        </p>
      </LegalSection>

      <LegalSection id="evolution" number={9} title="Évolution des conditions">
        <p>
          Ces conditions peuvent être mises à jour à tout moment ; la date de dernière mise à jour est
          indiquée en haut de cette page.
        </p>
      </LegalSection>

      <LegalSection id="contact" number={10} title="Contact">
        <p>
          Une question sur ces conditions ? Écris-nous depuis la <Link href="/contact">page Contact</Link>.
        </p>
      </LegalSection>
    </HelpCenter>
  );
}

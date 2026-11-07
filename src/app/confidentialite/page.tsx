import Link from "next/link";
import HelpCenter, { LegalSection, Summary } from "@/components/HelpCenter/HelpCenter";

export const metadata = {
  title: "Confidentialité | ZorAnim",
};

const SECTIONS = [
  { id: "donnees", label: "Données collectées" },
  { id: "utilisation", label: "Utilisation" },
  { id: "visibilite", label: "Ce qui est public" },
  { id: "hebergement", label: "Hébergement" },
  { id: "cookies", label: "Cookies et stockage local" },
  { id: "conservation", label: "Conservation" },
  { id: "droits", label: "Tes droits" },
  { id: "evolution", label: "Évolution" },
];

export default function ConfidentialitePage() {
  return (
    <HelpCenter
      active="confidentialite"
      title="Confidentialité"
      subtitle="Quelles données ZorAnim conserve, pourquoi, et comment garder la main dessus."
      updated="7 novembre 2026"
      toc={SECTIONS}
    >
      <Summary
        items={[
          "Seules les données utiles au fonctionnement du site sont conservées.",
          "Rien n'est revendu ni partagé à des fins publicitaires.",
          "Un seul cookie : celui qui te garde connecté.",
          "Ton compte et ses données se suppriment à tout moment depuis ton profil.",
        ]}
      />

      <LegalSection id="donnees" number={1} title="Données collectées">
        <p>Selon ce que tu utilises sur le site, ZorAnim conserve :</p>
        <ul>
          <li>
            <strong>Ton compte</strong> : pseudo, adresse email et mot de passe (chiffré, jamais stocké
            en clair), photo de profil si tu en ajoutes une.
          </li>
          <li>
            <strong>Ton activité</strong> : ta liste, ton historique, ta position de lecture dans chaque
            film ou épisode (pour la section « Reprendre »), tes notes, réactions et commentaires.
          </li>
          <li>
            <strong>Ton profil créateur</strong> : bio, avatar, bannière, studios, ainsi que les
            contenus que tu proposes et leurs demandes de sortie (date, avant-première, annonce, note
            pour l&apos;équipe).
          </li>
          <li>
            <strong>Tes échanges avec l&apos;équipe</strong> : messages envoyés via la page Contact et
            leurs réponses, candidatures et éventuelles demandes de déban.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="utilisation" number={2} title="Utilisation">
        <p>
          Ces informations servent uniquement au fonctionnement du site : afficher ton profil, te
          permettre de reprendre un programme, gérer ta liste, traiter tes candidatures et
          propositions, t&apos;envoyer des notifications sur le site et te répondre. Elles ne sont ni
          revendues, ni partagées avec des tiers à des fins commerciales ou publicitaires.
        </p>
      </LegalSection>

      <LegalSection id="visibilite" number={3} title="Ce qui est public">
        <p>
          Ton pseudo et ta photo de profil sont visibles à côté de tes commentaires. Si tu es
          créateur, ta page publique affiche ton nom, ton avatar, ta bannière, ta bio, tes studios et
          tes contenus publiés. Ton adresse email, ton historique et ta liste ne sont jamais affichés
          publiquement.
        </p>
      </LegalSection>

      <LegalSection id="hebergement" number={4} title="Hébergement">
        <p>
          ZorAnim s&apos;appuie sur des prestataires techniques : Turso pour la base de données, et
          Cloudinary pour les images et vidéos envoyées (posters, bannières, avatars, films). Ils
          traitent ces données uniquement pour le compte de ZorAnim et dans ce cadre technique.
        </p>
      </LegalSection>

      <LegalSection id="cookies" number={5} title="Cookies et stockage local">
        <p>
          ZorAnim utilise un seul cookie, strictement nécessaire : celui qui te garde connecté.
          Aucun cookie de suivi ni de publicité n&apos;est utilisé.
        </p>
        <p>
          Ton navigateur garde aussi en local ton choix sur le bandeau cookies, ainsi que des marques
          temporaires effacées à la fermeture de l&apos;onglet (par exemple pour rafraîchir la section
          « Reprendre » quand tu quittes le lecteur). Elles restent sur ton appareil.
        </p>
      </LegalSection>

      <LegalSection id="conservation" number={6} title="Conservation">
        <p>
          Les données sont conservées tant que ton compte existe. Quand tu supprimes ton compte, ton
          profil, ton activité et tes messages sont effacés. Si ton compte porte une page artiste ou a
          fondé un studio, contacte d&apos;abord l&apos;équipe pour retirer la page ou transférer le studio.
        </p>
      </LegalSection>

      <LegalSection id="droits" number={7} title="Tes droits">
        <ul>
          <li>Consulter et modifier les informations de ton compte directement depuis ton profil.</li>
          <li>Demander la rectification ou la suppression de tes données.</li>
          <li>Supprimer ton compte à tout moment depuis la zone de danger de ton profil.</li>
          <li>T&apos;opposer au traitement de tes données.</li>
        </ul>
        <p>
          Pour exercer ces droits, écris-nous depuis la <Link href="/contact">page Contact</Link>.
        </p>
      </LegalSection>

      <LegalSection id="evolution" number={8} title="Évolution">
        <p>
          Cette politique pourra évoluer avec le développement du site ; la date de dernière mise à
          jour est indiquée en haut de cette page.
        </p>
      </LegalSection>
    </HelpCenter>
  );
}

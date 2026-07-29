import InfoPage from "@/components/InfoPage/InfoPage";

export default function ConditionsPage() {
  return (
    <InfoPage
      title="Conditions d'utilisation"
      subtitle="Les règles qui encadrent l'utilisation de ZorAnim."
      updated="28 juillet 2026"
    >
      <h2>1. Objet</h2>
      <p>
        ZorAnim est une plateforme de streaming dédiée aux courts-métrages et séries
        d&apos;animation 2D réalisés par des artistes indépendants. L&apos;utilisation du site implique
        l&apos;acceptation pleine et entière des présentes conditions.
      </p>

      <h2>2. Compte et accès au service</h2>
      <p>
        La création d&apos;un compte est obligatoire pour parcourir le catalogue et regarder les
        films et séries : seule la page d&apos;accueil est visible sans compte. Le service est gratuit
        et ne demande aucune information de paiement. Tu es responsable de la confidentialité de ton
        mot de passe et de l&apos;activité effectuée depuis ton compte.
      </p>

      <h2>3. Devenir artiste et studios</h2>
      <p>
        Tout utilisateur peut candidater pour devenir artiste via la page « Devenir artiste ». Une
        fois accepté par l&apos;équipe, un artiste peut soumettre des films ou des séries et créer un
        studio regroupant plusieurs artistes. Le propriétaire d&apos;un studio est responsable des
        invitations qu&apos;il envoie et du contenu soumis au nom du studio.
      </p>

      <h2>4. Soumission de contenu</h2>
      <p>
        Toute personne soumettant un film, une série ou une candidature d&apos;artiste garantit
        détenir les droits nécessaires sur les fichiers envoyés (vidéo, poster, avatar) et
        s&apos;engage à ne transmettre aucun contenu illicite, protégé par des droits de tiers non
        autorisés, ou contraire aux présentes conditions. Chaque soumission est examinée par
        l&apos;équipe avant publication et peut être refusée sans obligation de justification
        détaillée.
      </p>

      <h2>5. Contenu et propriété intellectuelle</h2>
      <p>
        Chaque film ou série reste la propriété exclusive de son artiste ou studio. Toute
        reproduction, diffusion ou réutilisation en dehors de ZorAnim nécessite l&apos;accord
        préalable de l&apos;ayant droit concerné.
      </p>

      <h2>6. Comportement des utilisateurs</h2>
      <ul>
        <li>Respecter les artistes et les autres visiteurs du site.</li>
        <li>Ne pas tenter de contourner les protections techniques du contenu ou les limites d&apos;envoi.</li>
        <li>Ne pas utiliser le site à des fins commerciales non autorisées.</li>
        <li>Ne pas usurper l&apos;identité d&apos;un autre artiste ou d&apos;un studio.</li>
      </ul>

      <h2>7. Disponibilité du service</h2>
      <p>
        ZorAnim est fourni « en l&apos;état ». Le site étant en développement actif, certaines
        fonctionnalités peuvent évoluer, être temporairement indisponibles ou modifiées sans
        préavis.
      </p>

      <h2>8. Modification des conditions</h2>
      <p>
        Ces conditions peuvent être mises à jour à tout moment ; la date de dernière mise à jour
        est indiquée en haut de cette page.
      </p>

      <h2>9. Contact</h2>
      <p>
        Pour toute question relative à ces conditions, contacte-nous via la{" "}
        <a href="/contact" style={{ color: "var(--accent, #e50914)", textDecoration: "underline" }}>
          page Contact
        </a>
        .
      </p>
    </InfoPage>
  );
}

import InfoPage from "@/components/InfoPage/InfoPage";

export default function ConditionsPage() {
  return (
    <InfoPage
      title="Conditions d'utilisation"
      subtitle="Les règles qui encadrent l'utilisation de ZorAnim."
      updated="23 juillet 2026"
    >
      <h2>1. Objet</h2>
      <p>
        ZorAnim est une plateforme de streaming dédiée aux courts-métrages d&apos;animation 2D
        réalisés par des artistes indépendants. L&apos;utilisation du site implique l&apos;acceptation
        pleine et entière des présentes conditions.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        Le catalogue est accessible librement et gratuitement, sans création de compte
        obligatoire, dans la limite des fonctionnalités disponibles à ce stade du développement du
        site.
      </p>

      <h2>3. Contenu et propriété intellectuelle</h2>
      <p>
        Chaque film reste la propriété exclusive de son artiste ou studio. Toute reproduction,
        diffusion ou réutilisation en dehors de ZorAnim nécessite l&apos;accord préalable de
        l&apos;ayant droit concerné.
      </p>

      <h2>4. Comportement des utilisateurs</h2>
      <ul>
        <li>Respecter les artistes et les autres visiteurs du site.</li>
        <li>Ne pas tenter de contourner les protections techniques du contenu.</li>
        <li>Ne pas utiliser le site à des fins commerciales non autorisées.</li>
      </ul>

      <h2>5. Disponibilité du service</h2>
      <p>
        ZorAnim est fourni « en l&apos;état ». Le site étant en développement actif, certaines
        fonctionnalités peuvent évoluer, être temporairement indisponibles ou modifiées sans
        préavis.
      </p>

      <h2>6. Modification des conditions</h2>
      <p>
        Ces conditions peuvent être mises à jour à tout moment ; la date de dernière mise à jour
        est indiquée en haut de cette page.
      </p>

      <h2>7. Contact</h2>
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

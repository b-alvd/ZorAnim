import InfoPage from "@/components/InfoPage/InfoPage";

export default function ConfidentialitePage() {
  return (
    <InfoPage
      title="Confidentialité"
      subtitle="Comment ZorAnim traite tes données personnelles."
      updated="23 juillet 2026"
    >
      <h2>Données collectées</h2>
      <p>
        Dans sa phase actuelle, ZorAnim ne collecte pas de données personnelles au-delà de ce qui
        est strictement nécessaire au bon fonctionnement technique du site (par exemple, les
        informations transmises volontairement via le formulaire de contact).
      </p>

      <h2>Utilisation des données</h2>
      <p>
        Les informations que tu nous transmets via le formulaire de contact ne sont utilisées que
        pour te répondre. Elles ne sont ni revendues, ni partagées avec des tiers à des fins
        commerciales.
      </p>

      <h2>Cookies</h2>
      <p>
        ZorAnim n&apos;utilise aucun cookie de suivi publicitaire. Seuls des cookies techniques,
        strictement nécessaires au fonctionnement du site, pourront être utilisés à l&apos;avenir.
      </p>

      <h2>Tes droits</h2>
      <ul>
        <li>Accéder aux données que tu nous as transmises.</li>
        <li>Demander leur rectification ou leur suppression.</li>
        <li>T&apos;opposer à leur traitement à tout moment.</li>
      </ul>
      <p>
        Pour exercer ces droits, contacte-nous via la{" "}
        <a href="/contact" style={{ color: "var(--accent, #e50914)", textDecoration: "underline" }}>
          page Contact
        </a>
        .
      </p>

      <h2>Évolution de cette politique</h2>
      <p>
        Cette politique de confidentialité pourra être amenée à évoluer avec le développement du
        site ; la date de dernière mise à jour est indiquée en haut de cette page.
      </p>
    </InfoPage>
  );
}

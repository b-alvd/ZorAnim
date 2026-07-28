import InfoPage from "@/components/InfoPage/InfoPage";

export default function ConfidentialitePage() {
  return (
    <InfoPage
      title="Confidentialité"
      subtitle="Comment ZorAnim traite tes données personnelles."
      updated="28 juillet 2026"
    >
      <h2>Données collectées</h2>
      <p>
        Pour créer un compte, ZorAnim collecte ton nom, ton adresse email et un mot de passe
        (stocké de façon chiffrée, jamais en clair). Si tu ajoutes une photo de profil, deviens
        artiste, crées un studio ou soumets un film, les informations correspondantes (bio,
        avatar, fichiers envoyés) sont également conservées. Les messages envoyés via la page
        Contact sont stockés avec la réponse de l&apos;équipe.
      </p>

      <h2>Utilisation des données</h2>
      <p>
        Ces informations servent uniquement au fonctionnement du site : afficher ton profil,
        gérer tes favoris et ton historique de visionnage, traiter tes candidatures et
        soumissions, et te répondre si tu nous contactes. Elles ne sont ni revendues, ni
        partagées avec des tiers à des fins commerciales.
      </p>

      <h2>Hébergement et prestataires techniques</h2>
      <p>
        ZorAnim utilise des prestataires tiers pour fonctionner : Turso pour la base de données,
        et Cloudinary pour l&apos;hébergement des images et vidéos que tu envoies (posters, films,
        avatars). Ces prestataires traitent les données uniquement pour le compte de ZorAnim et
        dans ce cadre technique.
      </p>

      <h2>Cookies</h2>
      <p>
        ZorAnim utilise un cookie de session, strictement nécessaire pour te garder connecté à
        ton compte. Aucun cookie de suivi publicitaire n&apos;est utilisé.
      </p>

      <h2>Tes droits</h2>
      <ul>
        <li>Accéder aux données de ton compte, modifiables directement depuis ton profil.</li>
        <li>Demander la rectification ou la suppression de tes données.</li>
        <li>Supprimer ton compte à tout moment depuis la « Zone de danger » de ton profil.</li>
        <li>T&apos;opposer au traitement de tes données à tout moment.</li>
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

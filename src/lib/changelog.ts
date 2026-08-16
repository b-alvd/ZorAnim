export type ChangelogEntry = {
  version: string;
  date: string;
  changes: string[];
};

// Newest first. Keep entries short and user-facing, not commit-by-commit.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.7.0",
    date: "16 août 2026",
    changes: [
      "Le lecteur vidéo masque désormais sa barre de contrôle après quelques secondes d'inactivité et la fait réapparaître au moindre mouvement de souris.",
      "La page Catalogue affiche des noms de section (« Tout le catalogue », « Bientôt sur ZorAnim »).",
      "Le message d'accueil de l'équipe n'est plus une popup : il est désormais intégré directement sur la page d'accueil.",
      "Ajout d'un indicateur de version et de cette page des mises à jour.",
      "Un encart de nouveautés personnalisable par l'équipe peut désormais apparaître sur la page d'accueil.",
      "Les notes affichent maintenant les demi-étoiles (et plus généralement la vraie note, plus d'arrondi à l'étoile supérieure).",
      "Le hero de la page d'accueil (connecté) occupe maintenant tout l'écran sous la navbar.",
      "Les moins sages d'entre vous pourront désormais goûter au bannissement. Une demande de déban reste possible pour plaider sa cause auprès de l'équipe.",
    ],
  },
  {
    version: "0.6.0",
    date: "15 août 2026",
    changes: [
      "Ajout d'un compte à rebours animé avant l'ouverture officielle du site.",
      "Ajout d'une page de maintenance activable depuis l'admin.",
      "Message de bienvenue de l'équipe visible sur la page d'accueil.",
    ],
  },
  {
    version: "0.5.0",
    date: "13 août 2026",
    changes: [
      "Le catalogue et la lecture des films/séries sont désormais accessibles sans créer de compte.",
      "Corrections d'affichage : nom des séries dans les classements, comptages dans le panel admin.",
    ],
  },
  {
    version: "0.4.0",
    date: "11 août 2026",
    changes: [
      "Nouvelle fiche film/série : sélection de saison avec liste d'épisodes, bouton bande-annonce séparé du film complet.",
    ],
  },
  {
    version: "0.3.0",
    date: "10 août 2026",
    changes: [
      "Ajout des teasers/bandes-annonces pour les films et séries pas encore sortis.",
      "Nouvelle catégorie « Bientôt sur ZorAnim » pour le contenu à venir.",
      "Corrections de comptage pour les studios et les séries multi-épisodes.",
    ],
  },
  {
    version: "0.2.0",
    date: "29 juillet 2026",
    changes: [
      "Ajout des notes, commentaires (réponses et réactions), pages studios, recherche, notifications.",
      "Support complet des séries et des saisons.",
      "Filtres du catalogue, bannière de cookies, référencement (SEO).",
    ],
  },
  {
    version: "0.1.0",
    date: "28 juillet 2026",
    changes: [
      "Lancement : panel admin, système de soumission de films/séries, page d'accueil, favoris et historique, messagerie de contact.",
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;

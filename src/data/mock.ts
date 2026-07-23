export type Film = {
  id: string;
  title: string;
  synopsis: string;
  year: number;
  duration: string;
  rating: string;
  isNew?: boolean;
};

export const films: Film[] = [
  {
    id: "1",
    title: "Lueur de Nuit",
    synopsis: "Une lanterne égarée traverse une ville endormie à la recherche de son propriétaire.",
    year: 2024,
    duration: "12 min",
    rating: "Tout public",
    isNew: true,
  },
  {
    id: "2",
    title: "Échos de Métal",
    synopsis: "Dans une usine abandonnée, un robot oublié découvre ce qu'il reste de l'humanité.",
    year: 2023,
    duration: "18 min",
    rating: "12+",
  },
  {
    id: "3",
    title: "La Dernière Recette",
    synopsis: "Un chef vieillissant transmet son dernier secret culinaire à son petit-fils.",
    year: 2022,
    duration: "9 min",
    rating: "Tout public",
  },
  {
    id: "4",
    title: "Pixel Bleu",
    synopsis: "Un petit personnage de jeu vidéo tente de s'échapper de son propre monde en 8-bit.",
    year: 2024,
    duration: "7 min",
    rating: "Tout public",
    isNew: true,
  },
  {
    id: "5",
    title: "Racines",
    synopsis: "Une forêt se souvient de chaque être qui a vécu sous ses branches.",
    year: 2021,
    duration: "15 min",
    rating: "Tout public",
  },
  {
    id: "6",
    title: "Signal Perdu",
    synopsis: "Un opérateur radio capte un message venu d'un futur qui ne devrait pas exister.",
    year: 2023,
    duration: "22 min",
    rating: "14+",
  },
];

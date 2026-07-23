export type Film = {
  id: string;
  title: string;
  synopsis: string;
  year: number;
  duration: string;
  rating: string;
  isNew?: boolean;
  poster: string;
};

const posterColors = [
  ["#3a0ca3", "#7209b7"],
  ["#0a4d68", "#088395"],
  ["#6a040f", "#e85d04"],
  ["#1b4332", "#40916c"],
  ["#3d0000", "#b0060c"],
  ["#22223b", "#4a4e69"],
];

function placeholderPoster(seed: number, title: string) {
  const [c1, c2] = posterColors[seed % posterColors.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c1}'/>
        <stop offset='1' stop-color='${c2}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' fill='rgba(255,255,255,0.8)' font-family='Helvetica, Arial, sans-serif'
      font-size='36' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const rawFilms: Omit<Film, "poster">[] = [
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

export const films: Film[] = rawFilms.map((f, i) => ({
  ...f,
  poster: placeholderPoster(i, f.title),
}));

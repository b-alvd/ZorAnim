import { db } from "@/db";
import { artists, films } from "@/db/schema";
import { placeholderPoster, placeholderAvatar } from "@/lib/placeholder";

const PLACEHOLDER_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const rawArtists = [
  {
    id: "camille-roux",
    name: "Camille Roux",
    bio: "Réalisatrice indépendante passionnée par les histoires oniriques et les ambiances nocturnes.",
  },
  {
    id: "studio-kaira",
    name: "Studio Kaira",
    bio: "Petit studio d'animation spécialisé dans la science-fiction et les mondes rétro-futuristes.",
  },
  {
    id: "nadia-ferrand",
    name: "Nadia Ferrand",
    bio: "Autrice et animatrice, elle raconte des histoires intimes ancrées dans le quotidien.",
  },
];

const rawFilms = [
  {
    id: "1",
    title: "Lueur de Nuit",
    synopsis: "Une lanterne égarée traverse une ville endormie à la recherche de son propriétaire.",
    year: 2024,
    duration: "12 min",
    rating: "Tout public",
    category: "Fantastique & Onirique",
    artistId: "camille-roux",
    isNew: true,
  },
  {
    id: "2",
    title: "Échos de Métal",
    synopsis: "Dans une usine abandonnée, un robot oublié découvre ce qu'il reste de l'humanité.",
    year: 2023,
    duration: "18 min",
    rating: "12+",
    category: "Science-Fiction",
    artistId: "studio-kaira",
    isNew: false,
  },
  {
    id: "3",
    title: "La Dernière Recette",
    synopsis: "Un chef vieillissant transmet son dernier secret culinaire à son petit-fils.",
    year: 2022,
    duration: "9 min",
    rating: "Tout public",
    category: "Drame",
    artistId: "nadia-ferrand",
    isNew: false,
  },
  {
    id: "4",
    title: "Pixel Bleu",
    synopsis: "Un petit personnage de jeu vidéo tente de s'échapper de son propre monde en 8-bit.",
    year: 2024,
    duration: "7 min",
    rating: "Tout public",
    category: "Comédie",
    artistId: "studio-kaira",
    isNew: true,
  },
  {
    id: "5",
    title: "Racines",
    synopsis: "Une forêt se souvient de chaque être qui a vécu sous ses branches.",
    year: 2021,
    duration: "15 min",
    rating: "Tout public",
    category: "Fantastique & Onirique",
    artistId: "camille-roux",
    isNew: false,
  },
  {
    id: "6",
    title: "Signal Perdu",
    synopsis: "Un opérateur radio capte un message venu d'un futur qui ne devrait pas exister.",
    year: 2023,
    duration: "22 min",
    rating: "14+",
    category: "Science-Fiction",
    artistId: "nadia-ferrand",
    isNew: false,
  },
];

async function main() {
  // Idempotent: clear then re-seed, so this can be safely re-run in dev.
  await db.delete(films);
  await db.delete(artists);

  await db.insert(artists).values(
    rawArtists.map((a, i) => ({
      ...a,
      avatar: placeholderAvatar(i, a.name),
    }))
  );

  await db.insert(films).values(
    rawFilms.map((f, i) => ({
      ...f,
      poster: placeholderPoster(i, f.title),
      videoUrl: PLACEHOLDER_VIDEO,
    }))
  );

  console.log(`Seeded ${rawArtists.length} artists and ${rawFilms.length} films.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

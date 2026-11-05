import {
  getArtists,
  getCategories,
  getFilmCreatedAts,
  getFilmEngagement,
  getFilms,
  getStudios,
} from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import { getPremiereStatus } from "@/lib/premiere";
import type { Film } from "@/data/types";
import FilmsManager, { type AdminFilm, type FilmStatus } from "./FilmsManager";
import FilmCreateButton from "./FilmCreateButton";
import styles from "../shared.module.css";

// Formatted here, pinned to Paris time, so server and browser render the
// exact same string.
function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function statusOf(film: Film): FilmStatus {
  if (film.episodeKind === "announcement") return { kind: "announcement" };
  const status = getPremiereStatus(film);
  if (status === "preview") return { kind: "live" };
  if (status === "locked") {
    const premiereUpcoming = !!film.premiereAt && new Date(film.premiereAt).getTime() > Date.now();
    if (premiereUpcoming) return { kind: "premiere", at: film.premiereAt!, label: formatWhen(film.premiereAt!) };
    if (film.releaseAt) return { kind: "scheduled", at: film.releaseAt, label: formatWhen(film.releaseAt) };
  }
  return { kind: "available" };
}

export default async function AdminFilmsPage() {
  const [allFilms, personalArtists, studioList, existingCategories, createdAts] = await Promise.all([
    getFilms(),
    getArtists(),
    getStudios(),
    getCategories(),
    getFilmCreatedAts(),
  ]);
  const artists = [...personalArtists, ...studioList];
  const categories = mergeCategories(existingCategories);
  const engagement = await getFilmEngagement(allFilms.map((f) => f.id));

  const films: AdminFilm[] = allFilms.map((film) => ({
    ...film,
    createdAt: createdAts.get(film.id) ?? "",
    views: engagement.get(film.id)?.views ?? 0,
    comments: engagement.get(film.id)?.comments ?? 0,
    status: statusOf(film),
  }));

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Films &amp; séries</h1>
        <FilmCreateButton artists={artists} categories={categories} />
      </div>
      <FilmsManager films={films} artists={artists} categories={categories} />
    </main>
  );
}

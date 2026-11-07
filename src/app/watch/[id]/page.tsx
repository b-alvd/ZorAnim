import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFilm,
  getSeriesEpisodes,
  getFilms,
  getWatchEntries,
  getWatchPosition,
  incrementGuestView,
  incrementTrailerView,
  markWatched,
} from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPremiereStatus, getPremiereUnlockAt } from "@/lib/premiere";
import { collapseSeries, isReleased, splitComingSoon } from "@/lib/series";
import type { Film } from "@/data/types";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import PremiereVideoPlayer from "@/components/PremiereVideoPlayer/PremiereVideoPlayer";
import PremiereLock from "@/components/PremiereLock/PremiereLock";
import styles from "./watch.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const film = await getFilm(id);
  if (!film) return { title: "Film introuvable | ZorAnim" };

  const description = film.synopsis.length > 160 ? `${film.synopsis.slice(0, 157)}...` : film.synopsis;
  return {
    title: `${film.title} | ZorAnim`,
    description,
    openGraph: {
      title: film.title,
      description,
      images: [{ url: film.poster }],
      type: "video.other",
    },
  };
}

const SUGGESTION_COUNT = 4;

// What to watch after a film: released contents, other series than the one
// just watched, same category first, then the best rated.
async function loadSuggestions(film: Film) {
  const { released } = splitComingSoon(await getFilms());
  return collapseSeries(released)
    .filter((f) => f.id !== film.id && (!film.seriesTitle || f.seriesTitle !== film.seriesTitle))
    .sort(
      (a, b) =>
        Number(b.category === film.category) - Number(a.category === film.category) ||
        (b.avgRating ?? -1) - (a.avgRating ?? -1)
    )
    .slice(0, SUGGESTION_COUNT);
}

// Outside the component: reading the clock there is fine.
function premiereHasAired(premiereAt: string | null): boolean {
  return !!premiereAt && new Date(premiereAt).getTime() <= Date.now();
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoplay?: string; variant?: string; trailer?: string }>;
}) {
  const user = await getCurrentUser();

  const { id } = await params;
  const { autoplay, variant, trailer: trailerId } = await searchParams;
  const film = await getFilm(id);
  if (!film) notFound();

  // A trailer is promotional: playable even while the content itself is
  // locked (premiere, scheduled release), and not counted as a view.
  // An announcement fiche has no video of its own: it plays its trailer.
  const wantsTrailer = variant === "teaser" || film.episodeKind === "announcement";
  const trailer = wantsTrailer ? (film.trailers.find((t) => t.id === trailerId) ?? film.trailers[0] ?? null) : null;
  if (trailer) {
    // Counted on the trailer itself, never as a view of the content.
    await incrementTrailerView(trailer.id);
    const trailerFilm = { ...film, videoUrl: trailer.videoUrl, title: `${film.seriesTitle ?? film.title} · ${trailer.title}` };
    return (
      <main className={styles.page}>
        <VideoPlayer film={trailerFilm} suggestions={[]} episodes={[]} autoplay={autoplay === "1"} />
      </main>
    );
  }

  if (film.episodeKind === "announcement") notFound();

  if (getPremiereStatus(film) === "locked" && user?.role !== "admin") {
    const hasAired = premiereHasAired(film.premiereAt);
    return (
      <main className={styles.page}>
        <PremiereLock film={film} unlockAt={getPremiereUnlockAt(film)} hasAired={hasAired} />
      </main>
    );
  }

  const livePremiere = getPremiereStatus(film) === "preview";

  if (livePremiere) {
    await (user ? markWatched(user.id, film.id) : incrementGuestView(film.id));
    return (
      <main className={styles.page}>
        <PremiereVideoPlayer film={film} />
      </main>
    );
  }

  const [suggestions, episodes, resumeAt, entries] = await Promise.all([
    loadSuggestions(film),
    film.seriesTitle
      ? getSeriesEpisodes(film.seriesTitle).then((list) => list.filter((ep) => ep.episodeKind !== "announcement"))
      : Promise.resolve([]),
    // Read before markWatched, which only touches the date.
    user ? getWatchPosition(user.id, film.id) : Promise.resolve(0),
    user ? getWatchEntries(user.id) : Promise.resolve(new Map<string, { at: string; position: number }>()),
  ]);
  // Per episode: absent = not watched, 0 = finished, > 0 = stopped there.
  const episodeProgress = Object.fromEntries(
    episodes.filter((ep) => entries.has(ep.id)).map((ep) => [ep.id, entries.get(ep.id)!.position])
  );
  const lockedEpisodeIds = episodes.filter((ep) => !isReleased(ep)).map((ep) => ep.id);
  await (user ? markWatched(user.id, film.id) : incrementGuestView(film.id));

  return (
    <main className={styles.page}>
      <VideoPlayer
        film={film}
        suggestions={suggestions}
        episodes={episodes}
        autoplay={autoplay === "1"}
        resumeAt={resumeAt}
        trackProgress={!!user}
        episodeProgress={episodeProgress}
        lockedEpisodeIds={lockedEpisodeIds}
      />
    </main>
  );
}

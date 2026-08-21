import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFilm, getSeriesEpisodes, getSuggestions, incrementGuestView, markWatched } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPremiereStatus, getPremiereUnlockAt } from "@/lib/premiere";
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

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoplay?: string; variant?: string }>;
}) {
  const user = await getCurrentUser();

  const { id } = await params;
  const { autoplay, variant } = await searchParams;
  const film = await getFilm(id);
  if (!film) notFound();

  if (getPremiereStatus(film) === "locked" && user?.role !== "admin") {
    const hasAired = !!film.premiereAt && new Date(film.premiereAt).getTime() <= Date.now();
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

  const [suggestions, episodes] = await Promise.all([
    getSuggestions(film.id),
    film.seriesTitle ? getSeriesEpisodes(film.seriesTitle) : Promise.resolve([]),
    user ? markWatched(user.id, film.id) : incrementGuestView(film.id),
  ]);

  const playbackFilm = variant === "teaser" && film.teaserVideoUrl ? { ...film, videoUrl: film.teaserVideoUrl } : film;

  return (
    <main className={styles.page}>
      <VideoPlayer
        film={playbackFilm}
        suggestions={suggestions}
        episodes={episodes}
        autoplay={autoplay === "1"}
      />
    </main>
  );
}

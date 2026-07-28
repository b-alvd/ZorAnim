import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getFilm, getSuggestions, markWatched } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
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
  searchParams: Promise<{ autoplay?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { id } = await params;
  const { autoplay } = await searchParams;
  const film = await getFilm(id);
  if (!film) notFound();

  const [suggestions] = await Promise.all([getSuggestions(film.id), markWatched(user.id, film.id)]);

  return (
    <main className={styles.page}>
      <VideoPlayer film={film} suggestions={suggestions} autoplay={autoplay === "1"} />
    </main>
  );
}

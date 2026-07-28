import { notFound, redirect } from "next/navigation";
import { getFilm, getSuggestions, markWatched } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import styles from "./watch.module.css";

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

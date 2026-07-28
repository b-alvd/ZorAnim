import { notFound } from "next/navigation";
import { getFilm, getSuggestions } from "@/db/queries";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import styles from "./watch.module.css";

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoplay?: string }>;
}) {
  const { id } = await params;
  const { autoplay } = await searchParams;
  const film = await getFilm(id);
  if (!film) notFound();

  const suggestions = await getSuggestions(film.id);

  return (
    <main className={styles.page}>
      <VideoPlayer film={film} suggestions={suggestions} autoplay={autoplay === "1"} />
    </main>
  );
}

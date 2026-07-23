import { notFound } from "next/navigation";
import { getFilm } from "@/data/mock";
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
  const film = getFilm(id);
  if (!film) notFound();

  return (
    <main className={styles.page}>
      <VideoPlayer film={film} autoplay={autoplay === "1"} />
    </main>
  );
}

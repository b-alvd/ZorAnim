import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import { getFavoriteFilmIds, getSeriesEpisodeCounts, getWatchHistory } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries } from "@/lib/series";
import styles from "../catalogue/catalogue.module.css";

export default async function HistoriquePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [rawFilms, favoriteIds] = await Promise.all([getWatchHistory(user.id), getFavoriteFilmIds(user.id)]);
  const seriesTitles = [...new Set(rawFilms.map((f) => f.seriesTitle).filter((t): t is string => !!t))];
  const trueCounts = await getSeriesEpisodeCounts(seriesTitles);
  const films = collapseSeries(rawFilms, trueCounts);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Historique</h1>
        <p className={styles.subtitle}>
          {films.length} film{films.length > 1 ? "s" : ""} déjà visionné{films.length > 1 ? "s" : ""}
        </p>
      </div>
      {films.length > 0 ? (
        <div className={styles.grid}>
          {films.map((f) => (
            <Card key={f.id} film={f} isFavorite={favoriteIds.has(f.id)} isWatched episodeCount={f.episodeCount} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Tu n&apos;as encore rien regardé.</p>
      )}
    </main>
  );
}

import Card from "@/components/Card/Card";
import GuestBanner from "@/components/GuestBanner/GuestBanner";
import { getFavoriteFilmIds, getNewFilms, getSeriesEpisodeIds, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries, computeEffectiveWatchedIds } from "@/lib/series";
import styles from "../catalogue/catalogue.module.css";

export default async function NouveautesPage() {
  const user = await getCurrentUser();

  const [rawNewFilms, favoriteIds, watchedIds] = await Promise.all([
    getNewFilms(),
    user ? getFavoriteFilmIds(user.id) : Promise.resolve(new Set<string>()),
    user ? getWatchedFilmIds(user.id) : Promise.resolve(new Set<string>()),
  ]);
  const newFilms = collapseSeries(rawNewFilms);
  const seriesTitles = [...new Set(newFilms.filter((f) => f.seriesTitle).map((f) => f.seriesTitle!))];
  const episodeIdsMap = await getSeriesEpisodeIds(seriesTitles);
  const effectiveWatchedIds = computeEffectiveWatchedIds(newFilms, watchedIds, episodeIdsMap);

  return (
    <main className={styles.page}>
      {!user && <GuestBanner />}
      <div className={styles.header}>
        <h1 className={styles.title}>Nouveautés</h1>
        <p className={styles.subtitle}>
          {newFilms.length > 0
            ? `${newFilms.length} nouveau${newFilms.length > 1 ? "x" : ""} film${newFilms.length > 1 ? "s" : ""}`
            : "Rien de nouveau pour l'instant"}
        </p>
      </div>
      {newFilms.length > 0 ? (
        <div className={styles.grid}>
          {newFilms.map((f) => (
            <Card
              key={f.id}
              film={f}
              isFavorite={favoriteIds.has(f.id)}
              isWatched={effectiveWatchedIds.has(f.id)}
              episodeCount={f.episodeCount}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Reviens bientôt pour découvrir les prochains ajouts.</p>
      )}
    </main>
  );
}

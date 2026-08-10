import Hero from "@/components/Hero/Hero";
import Row from "@/components/Row/Row";
import Landing from "@/components/Landing/Landing";
import { getComingSoonFilms, getFavoriteFilmIds, getFilms, getSeriesEpisodeIds, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries, computeEffectiveWatchedIds } from "@/lib/series";
import styles from "./home.module.css";

export default async function Home() {
  const user = await getCurrentUser();
  const films = await getFilms();

  if (!user) return <Landing films={films} />;

  if (films.length === 0) {
    return (
      <main className={styles.empty}>
        <p className={styles.emptyText}>Aucun film ou série disponible pour l&apos;instant. Reviens bientôt !</p>
      </main>
    );
  }

  const [favoriteIds, watchedIds, comingSoonFilms] = await Promise.all([
    getFavoriteFilmIds(user.id),
    getWatchedFilmIds(user.id),
    getComingSoonFilms(),
  ]);
  const collapsedFilms = collapseSeries(films);
  const collapsedComingSoon = collapseSeries(comingSoonFilms);
  const seriesTitles = [...new Set(collapsedFilms.filter((f) => f.seriesTitle).map((f) => f.seriesTitle!))];
  const episodeIdsMap = await getSeriesEpisodeIds(seriesTitles);
  const effectiveWatchedIds = computeEffectiveWatchedIds(collapsedFilms, watchedIds, episodeIdsMap);

  return (
    <main>
      <Hero films={collapsedFilms} />
      <Row
        title="Nouveautés"
        films={collapsedFilms}
        favoriteIds={[...favoriteIds]}
        watchedIds={[...effectiveWatchedIds]}
      />
      {collapsedComingSoon.length > 0 && <Row title="Bientôt sur ZorAnim" films={collapsedComingSoon} />}
    </main>
  );
}

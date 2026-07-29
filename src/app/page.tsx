import Hero from "@/components/Hero/Hero";
import Row from "@/components/Row/Row";
import Landing from "@/components/Landing/Landing";
import { getFavoriteFilmIds, getFilms, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries } from "@/lib/series";
import styles from "./home.module.css";

export default async function Home() {
  const user = await getCurrentUser();
  const films = await getFilms();

  if (!user) return <Landing films={films} />;

  if (films.length === 0) {
    return (
      <main className={styles.empty}>
        <p className={styles.emptyText}>Aucun film disponible pour l&apos;instant. Reviens bientôt !</p>
      </main>
    );
  }

  const [favoriteIds, watchedIds] = await Promise.all([getFavoriteFilmIds(user.id), getWatchedFilmIds(user.id)]);
  const collapsedFilms = collapseSeries(films);

  return (
    <main>
      <Hero films={collapsedFilms} />
      <Row
        title="Nouveautés"
        films={collapsedFilms}
        favoriteIds={[...favoriteIds]}
        watchedIds={[...watchedIds]}
      />
    </main>
  );
}

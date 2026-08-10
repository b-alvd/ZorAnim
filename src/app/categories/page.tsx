import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import { getCategories, getFavoriteFilmIds, getFilms, getSeriesEpisodeIds, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries, computeEffectiveWatchedIds, splitComingSoon } from "@/lib/series";
import gridStyles from "../catalogue/catalogue.module.css";
import styles from "./categories.module.css";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [categories, films, favoriteIds, watchedIds] = await Promise.all([
    getCategories(),
    getFilms(),
    getFavoriteFilmIds(user.id),
    getWatchedFilmIds(user.id),
  ]);

  const allSeriesTitles = [...new Set(films.filter((f) => f.seriesTitle).map((f) => f.seriesTitle!))];
  const episodeIdsMap = await getSeriesEpisodeIds(allSeriesTitles);
  const collapsedComingSoon = collapseSeries(splitComingSoon(films).comingSoon);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Catégories</h1>
        <p className={styles.subtitle}>
          {categories.length} catégorie{categories.length > 1 ? "s" : ""} à explorer
        </p>
      </div>
      {collapsedComingSoon.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Bientôt sur ZorAnim</h2>
          <div className={gridStyles.grid}>
            {collapsedComingSoon.map((f) => (
              <Card key={f.id} film={f} episodeCount={f.episodeCount} comingSoon />
            ))}
          </div>
        </section>
      )}
      {categories.map((cat) => {
        const catFilms = collapseSeries(splitComingSoon(films.filter((f) => f.category === cat)).released);
        const effectiveWatchedIds = computeEffectiveWatchedIds(catFilms, watchedIds, episodeIdsMap);
        return (
          <section key={cat} className={styles.section}>
            <h2 className={styles.sectionTitle}>{cat}</h2>
            <div className={gridStyles.grid}>
              {catFilms.map((f) => (
                <Card
                  key={f.id}
                  film={f}
                  isFavorite={favoriteIds.has(f.id)}
                  isWatched={effectiveWatchedIds.has(f.id)}
                  episodeCount={f.episodeCount}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

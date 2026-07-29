import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import { getCategories, getFavoriteFilmIds, getFilms, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries } from "@/lib/series";
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

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Catégories</h1>
        <p className={styles.subtitle}>
          {categories.length} catégorie{categories.length > 1 ? "s" : ""} à explorer
        </p>
      </div>
      {categories.map((cat) => {
        const catFilms = collapseSeries(films.filter((f) => f.category === cat));
        return (
          <section key={cat} className={styles.section}>
            <h2 className={styles.sectionTitle}>{cat}</h2>
            <div className={gridStyles.grid}>
              {catFilms.map((f) => (
                <Card
                  key={f.id}
                  film={f}
                  isFavorite={favoriteIds.has(f.id)}
                  isWatched={watchedIds.has(f.id)}
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

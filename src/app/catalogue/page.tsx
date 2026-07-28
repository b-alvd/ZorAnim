import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import { getFavoriteFilmIds, getFilms, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { matchesQuery } from "@/lib/search";
import SearchBar from "./SearchBar";
import styles from "./catalogue.module.css";

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { q } = await searchParams;
  const query = q ?? "";
  const [allFilms, favoriteIds, watchedIds] = await Promise.all([
    getFilms(),
    getFavoriteFilmIds(user.id),
    getWatchedFilmIds(user.id),
  ]);
  const films = allFilms.filter((f) => matchesQuery(query, f.title, f.artistName, f.category, f.synopsis));

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Catalogue</h1>
        <p className={styles.subtitle}>
          {films.length} film{films.length > 1 ? "s" : ""} disponible{films.length > 1 ? "s" : ""}
        </p>
        <SearchBar />
      </div>
      {films.length > 0 ? (
        <div className={styles.grid}>
          {films.map((f) => (
            <Card key={f.id} film={f} isFavorite={favoriteIds.has(f.id)} isWatched={watchedIds.has(f.id)} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Aucun résultat pour &quot;{query}&quot;.</p>
      )}
    </main>
  );
}

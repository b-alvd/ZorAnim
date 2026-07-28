import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import Pagination from "@/components/Pagination/Pagination";
import { getFavoriteFilmIds, getFilms, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { matchesQuery } from "@/lib/search";
import SearchBar from "./SearchBar";
import styles from "./catalogue.module.css";

const PAGE_SIZE = 24;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { q, page: pageParam } = await searchParams;
  const query = q ?? "";
  const [allFilms, favoriteIds, watchedIds] = await Promise.all([
    getFilms(),
    getFavoriteFilmIds(user.id),
    getWatchedFilmIds(user.id),
  ]);
  const matched = allFilms.filter((f) => matchesQuery(query, f.title, f.artistName, f.category, f.synopsis));

  const totalPages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const films = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Catalogue</h1>
        <p className={styles.subtitle}>
          {matched.length} film{matched.length > 1 ? "s" : ""} disponible{matched.length > 1 ? "s" : ""}
        </p>
        <SearchBar />
      </div>
      {films.length > 0 ? (
        <>
          <div className={styles.grid}>
            {films.map((f) => (
              <Card key={f.id} film={f} isFavorite={favoriteIds.has(f.id)} isWatched={watchedIds.has(f.id)} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath="/catalogue" params={{ q: query || undefined }} />
        </>
      ) : (
        <p className={styles.empty}>Aucun résultat pour &quot;{query}&quot;.</p>
      )}
    </main>
  );
}

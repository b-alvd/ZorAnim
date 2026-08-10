import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import Pagination from "@/components/Pagination/Pagination";
import { getFavoriteFilmIds, getFilms, getSeriesEpisodeIds, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { matchesQuery } from "@/lib/search";
import {
  collapseSeries,
  computeEffectiveWatchedIds,
  countFilmsAndSeries,
  formatCatalogCountLabel,
  splitComingSoon,
} from "@/lib/series";
import SearchBar from "./SearchBar";
import Filters from "./Filters";
import styles from "./catalogue.module.css";

const PAGE_SIZE = 24;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string; year?: string; minRating?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { q, page: pageParam, category, year, minRating } = await searchParams;
  const query = q ?? "";
  const [allFilms, favoriteIds, watchedIds] = await Promise.all([
    getFilms(),
    getFavoriteFilmIds(user.id),
    getWatchedFilmIds(user.id),
  ]);

  const categories = [...new Set(allFilms.map((f) => f.category))].sort((a, b) => a.localeCompare(b));
  const years = [...new Set(allFilms.map((f) => f.year))].sort((a, b) => b - a);

  const minRatingValue = minRating ? Number(minRating) : 0;
  const matched = allFilms.filter((f) => {
    if (!matchesQuery(query, f.title, f.artistName, f.category, f.synopsis)) return false;
    if (category && f.category !== category) return false;
    if (year && f.year !== Number(year)) return false;
    if (minRatingValue > 0 && (f.avgRating ?? 0) < minRatingValue) return false;
    return true;
  });

  const { released, comingSoon } = splitComingSoon(matched);
  const collapsedComingSoon = collapseSeries(comingSoon);
  const collapsed = collapseSeries(released);
  const { filmCount, seriesCount } = countFilmsAndSeries(matched);
  const totalPages = Math.max(1, Math.ceil(collapsed.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const films = collapsed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const seriesTitles = [...new Set(films.filter((f) => f.seriesTitle).map((f) => f.seriesTitle!))];
  const episodeIdsMap = await getSeriesEpisodeIds(seriesTitles);
  const effectiveWatchedIds = computeEffectiveWatchedIds(films, watchedIds, episodeIdsMap);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Catalogue</h1>
        <p className={styles.subtitle}>{formatCatalogCountLabel(filmCount, seriesCount)} disponibles</p>
        <SearchBar />
        <Filters categories={categories} years={years} />
      </div>
      {collapsedComingSoon.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Bientôt sur ZorAnim</h2>
          <div className={styles.grid}>
            {collapsedComingSoon.map((f) => (
              <Card key={f.id} film={f} episodeCount={f.episodeCount} comingSoon />
            ))}
          </div>
        </div>
      )}
      {films.length > 0 ? (
        <>
          <div className={styles.grid}>
            {films.map((f) => (
              <Card
                key={f.id}
                film={f}
                isFavorite={favoriteIds.has(f.id)}
                isWatched={effectiveWatchedIds.has(f.id)}
                episodeCount={f.episodeCount}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/catalogue"
            params={{ q: query || undefined, category, year, minRating }}
          />
        </>
      ) : (
        <p className={styles.empty}>Aucun résultat pour ces critères.</p>
      )}
    </main>
  );
}

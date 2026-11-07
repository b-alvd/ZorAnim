import Card from "@/components/Card/Card";
import GuestBanner from "@/components/GuestBanner/GuestBanner";
import Pagination from "@/components/Pagination/Pagination";
import {
  getFavoriteFilmIds,
  getFilmAddedDates,
  getFilms,
  getSeriesEpisodeIds,
  getWatchedFilmIds,
} from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { matchesQuery } from "@/lib/search";
import { collapseSeries, computeEffectiveWatchedIds, formatCatalogCountLabel, splitComingSoon } from "@/lib/series";
import { sortByAdded, type RecentFilm } from "@/lib/recent";
import SearchBar from "./SearchBar";
import Filters, { CategoryPills } from "./Filters";
import styles from "./catalogue.module.css";

const PAGE_SIZE = 24;

type Params = {
  q?: string;
  page?: string;
  category?: string;
  year?: string;
  minRating?: string;
  type?: string;
  sort?: string;
};

const SORTERS: Record<string, (a: RecentFilm, b: RecentFilm) => number> = {
  note: (a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1),
  titre: (a, b) => (a.seriesTitle ?? a.title).localeCompare(b.seriesTitle ?? b.title, "fr"),
  annee: (a, b) => b.year - a.year,
};

// The catalogue lists what can be watched now; upcoming content is on the
// home page and in Nouveautés.
export default async function CataloguePage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await getCurrentUser();
  const { q, page: pageParam, category, year, minRating, type, sort } = await searchParams;
  const query = q ?? "";

  const [allFilms, dates, favoriteIds, watchedIds] = await Promise.all([
    getFilms(),
    getFilmAddedDates(),
    user ? getFavoriteFilmIds(user.id) : Promise.resolve(new Set<string>()),
    user ? getWatchedFilmIds(user.id) : Promise.resolve(new Set<string>()),
  ]);

  const { released } = splitComingSoon(allFilms);
  const all = collapseSeries(released);
  const categories = [...new Set(all.map((f) => f.category))].sort((a, b) => a.localeCompare(b, "fr"));
  const categoryCounts = Object.fromEntries(categories.map((c) => [c, all.filter((f) => f.category === c).length]));
  const years = [...new Set(all.map((f) => f.year))].sort((a, b) => b - a);

  const minRatingValue = minRating ? Number(minRating) : 0;
  const matched = released.filter((f) => {
    if (!matchesQuery(query, f.seriesTitle ?? "", f.title, f.artistName, f.category, f.synopsis)) return false;
    if (category && f.category !== category) return false;
    if (year && f.year !== Number(year)) return false;
    if (type === "films" && f.seriesTitle) return false;
    if (type === "series" && !f.seriesTitle) return false;
    return true;
  });

  let results = sortByAdded(collapseSeries(matched), released, dates);
  if (minRatingValue > 0) results = results.filter((f) => (f.avgRating ?? 0) >= minRatingValue);
  if (sort && SORTERS[sort]) results = [...results].sort(SORTERS[sort]);

  const filmCount = all.filter((f) => !f.seriesTitle).length;
  const seriesCount = all.length - filmCount;
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const films = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const seriesTitles = [...new Set(films.filter((f) => f.seriesTitle).map((f) => f.seriesTitle!))];
  const episodeIdsMap = await getSeriesEpisodeIds(seriesTitles);
  const effectiveWatchedIds = computeEffectiveWatchedIds(films, watchedIds, episodeIdsMap);
  const filtered = !!(query || category || year || minRating || type);

  return (
    <main className={styles.page}>
      {!user && <GuestBanner />}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Catalogue</h1>
            <p className={styles.subtitle}>{formatCatalogCountLabel(filmCount, seriesCount)} à regarder</p>
          </div>
          <SearchBar />
        </div>
        <CategoryPills categories={categories} counts={categoryCounts} />
        <Filters years={years} />
      </div>

      <div className={styles.resultsHead}>
        <h2 className={styles.sectionTitle}>{category || (filtered ? "Résultats" : "Tout le catalogue")}</h2>
        <span className={styles.resultsCount}>
          {results.length} résultat{results.length > 1 ? "s" : ""}
        </span>
      </div>

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
            params={{ q: query || undefined, category, year, minRating, type, sort }}
          />
        </>
      ) : (
        <p className={styles.empty}>Aucun résultat pour ces critères.</p>
      )}
    </main>
  );
}

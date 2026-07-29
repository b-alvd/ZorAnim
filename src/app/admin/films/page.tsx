import { getArtists, getCategories, getFilms } from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import Pagination from "@/components/Pagination/Pagination";
import FilmsList, { type FilmRow } from "./FilmsList";
import FilmCreateButton from "./FilmCreateButton";
import styles from "../shared.module.css";

const PAGE_SIZE = 20;

export default async function AdminFilmsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [allFilms, artists, existingCategories] = await Promise.all([getFilms(), getArtists(), getCategories()]);
  const categories = mergeCategories(existingCategories);

  const rows: FilmRow[] = [];
  const seriesIndex = new Map<string, number>();
  for (const film of allFilms) {
    if (!film.seriesTitle) {
      rows.push({ type: "film", film });
      continue;
    }
    const existingIndex = seriesIndex.get(film.seriesTitle);
    if (existingIndex === undefined) {
      seriesIndex.set(film.seriesTitle, rows.length);
      rows.push({ type: "series", title: film.seriesTitle, episodes: [film] });
    } else {
      const row = rows[existingIndex];
      if (row.type === "series") row.episodes.push(film);
    }
  }

  const { page: pageParam } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Films</h1>
        <FilmCreateButton artists={artists} categories={categories} />
      </div>
      <FilmsList rows={pageRows} artists={artists} categories={categories} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/films" />
    </main>
  );
}

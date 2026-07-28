import { getArtists, getCategories, getFilms } from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import Pagination from "@/components/Pagination/Pagination";
import FilmRowActions from "./FilmRowActions";
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

  const { page: pageParam } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(allFilms.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const films = allFilms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Films</h1>
        <FilmCreateButton artists={artists} categories={categories} />
      </div>
      <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Artiste</th>
            <th>Catégorie</th>
            <th>Année</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {films.map((f) => (
            <tr key={f.id}>
              <td>{f.title}</td>
              <td>{f.artistName}</td>
              <td>{f.category}</td>
              <td>{f.year}</td>
              <td>
                <FilmRowActions film={f} artists={artists} categories={categories} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/admin/films" />
    </main>
  );
}

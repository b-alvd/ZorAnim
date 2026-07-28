import { getArtists, getCategories, getFilms } from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import FilmRowActions from "./FilmRowActions";
import FilmCreateButton from "./FilmCreateButton";
import styles from "../shared.module.css";

export default async function AdminFilmsPage() {
  const [films, artists, existingCategories] = await Promise.all([getFilms(), getArtists(), getCategories()]);
  const categories = mergeCategories(existingCategories);

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Films</h1>
        <FilmCreateButton artists={artists} categories={categories} />
      </div>
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
    </main>
  );
}

import { getArtists, getCategories, getPendingArtistSubmissions, getPendingFilmSubmissions } from "@/db/queries";
import { mergeCategories } from "@/lib/categories";
import FilmSubmissionRowActions from "./FilmSubmissionRowActions";
import ArtistSubmissionRowActions from "./ArtistSubmissionRowActions";
import styles from "../shared.module.css";

export default async function AdminDemandesPage() {
  const [filmSubmissions, artistSubmissions, artists, existingCategories] = await Promise.all([
    getPendingFilmSubmissions(),
    getPendingArtistSubmissions(),
    getArtists(),
    getCategories(),
  ]);
  const categories = mergeCategories(existingCategories);

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Demandes de films</h1>
      </div>
      {filmSubmissions.length === 0 ? (
        <p className={styles.confirmText}>Aucune demande de film en attente.</p>
      ) : (
        <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Nom / studio</th>
              <th>Contact</th>
              <th>Catégorie</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filmSubmissions.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.artistName}</td>
                <td>{s.contactEmail}</td>
                <td>{s.category}</td>
                <td>
                  <FilmSubmissionRowActions submission={s} categories={categories} artists={artists} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <div className={styles.header} style={{ marginTop: 40 }}>
        <h1 className={styles.title}>Demandes d&apos;artistes</h1>
      </div>
      {artistSubmissions.length === 0 ? (
        <p className={styles.confirmText}>Aucune demande d&apos;artiste en attente.</p>
      ) : (
        <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th>Bio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {artistSubmissions.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.contactEmail}</td>
                <td>{s.bio.length > 80 ? `${s.bio.slice(0, 80)}…` : s.bio}</td>
                <td>
                  <ArtistSubmissionRowActions submission={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}

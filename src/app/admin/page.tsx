import { getFilms, getArtists, getPendingFilmSubmissions, getPendingArtistSubmissions } from "@/db/queries";
import { db } from "@/db";
import { users } from "@/db/schema";
import styles from "./dashboard.module.css";

export default async function AdminDashboard() {
  const [films, artists, allUsers, filmSubmissions, artistSubmissions] = await Promise.all([
    getFilms(),
    getArtists(),
    db.select().from(users),
    getPendingFilmSubmissions(),
    getPendingArtistSubmissions(),
  ]);
  const pendingCount = filmSubmissions.length + artistSubmissions.length;

  return (
    <main>
      <h1 className={styles.title}>Tableau de bord</h1>
      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.number}>{films.length}</span>
          <span className={styles.label}>Films</span>
        </div>
        <div className={styles.card}>
          <span className={styles.number}>{artists.length}</span>
          <span className={styles.label}>Artistes</span>
        </div>
        <div className={styles.card}>
          <span className={styles.number}>{allUsers.length}</span>
          <span className={styles.label}>Utilisateurs</span>
        </div>
        <div className={styles.card}>
          <span className={styles.number}>{pendingCount}</span>
          <span className={styles.label}>Demandes en attente</span>
        </div>
      </div>
    </main>
  );
}

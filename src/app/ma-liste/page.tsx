import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import { getFavoriteFilms, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "../catalogue/catalogue.module.css";

export default async function MaListePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [films, watchedIds] = await Promise.all([getFavoriteFilms(user.id), getWatchedFilmIds(user.id)]);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ma liste</h1>
        <p className={styles.subtitle}>
          {films.length} film{films.length > 1 ? "s" : ""} dans ta liste
        </p>
      </div>
      {films.length > 0 ? (
        <div className={styles.grid}>
          {films.map((f) => (
            <Card key={f.id} film={f} isFavorite isWatched={watchedIds.has(f.id)} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Ta liste est vide. Ajoute des films depuis leur fiche.</p>
      )}
    </main>
  );
}

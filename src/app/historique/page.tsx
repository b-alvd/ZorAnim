import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import { getFavoriteFilmIds, getWatchHistory } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "../catalogue/catalogue.module.css";

export default async function HistoriquePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [films, favoriteIds] = await Promise.all([getWatchHistory(user.id), getFavoriteFilmIds(user.id)]);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Historique</h1>
        <p className={styles.subtitle}>
          {films.length} film{films.length > 1 ? "s" : ""} déjà visionné{films.length > 1 ? "s" : ""}
        </p>
      </div>
      {films.length > 0 ? (
        <div className={styles.grid}>
          {films.map((f) => (
            <Card key={f.id} film={f} isFavorite={favoriteIds.has(f.id)} isWatched />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Tu n&apos;as encore rien regardé.</p>
      )}
    </main>
  );
}

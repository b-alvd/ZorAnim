import { redirect } from "next/navigation";
import ArtistCard from "@/components/ArtistCard/ArtistCard";
import { getFilms, getStudios } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { countFilmsAndSeries } from "@/lib/series";
import styles from "../artistes/artistes.module.css";

export default async function StudiosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [studios, films] = await Promise.all([getStudios(), getFilms()]);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Studios</h1>
        <p className={styles.subtitle}>
          {studios.length} studio{studios.length > 1 ? "s" : ""} sur ZorAnim
        </p>
      </div>
      {studios.length === 0 ? (
        <p className={styles.empty}>Aucun studio pour l&apos;instant.</p>
      ) : (
        <div className={styles.grid}>
          {studios.map((s) => {
            const { filmCount, seriesCount } = countFilmsAndSeries(films.filter((f) => f.artistId === s.id));
            return <ArtistCard key={s.id} artist={s} filmCount={filmCount} seriesCount={seriesCount} />;
          })}
        </div>
      )}
    </main>
  );
}

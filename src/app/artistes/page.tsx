import { redirect } from "next/navigation";
import ArtistCard from "@/components/ArtistCard/ArtistCard";
import { getArtists, getArtistStudios, getFilms } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { countFilmsAndSeries } from "@/lib/series";
import styles from "./artistes.module.css";

export default async function ArtistesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [allArtists, films] = await Promise.all([getArtists(), getFilms()]);
  const artists = allArtists.filter((a) => !a.isStudio);

  const counts = await Promise.all(
    artists.map(async (a) => {
      const artistStudios = await getArtistStudios(a.id);
      const studioIds = new Set(artistStudios.map((s) => s.id));
      const relevantFilms = films.filter((f) => f.artistId === a.id || studioIds.has(f.artistId));
      return countFilmsAndSeries(relevantFilms);
    })
  );

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Artistes</h1>
        <p className={styles.subtitle}>
          {artists.length} artiste{artists.length > 1 ? "s" : ""} indépendant
          {artists.length > 1 ? "s" : ""} sur ZorAnim
        </p>
      </div>
      <div className={styles.grid}>
        {artists.map((a, i) => (
          <ArtistCard key={a.id} artist={a} filmCount={counts[i].filmCount} seriesCount={counts[i].seriesCount} />
        ))}
      </div>
    </main>
  );
}

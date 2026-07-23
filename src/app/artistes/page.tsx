import ArtistCard from "@/components/ArtistCard/ArtistCard";
import { artists, filmsByArtist } from "@/data/mock";
import styles from "./artistes.module.css";

export default function ArtistesPage() {
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
        {artists.map((a) => (
          <ArtistCard key={a.id} artist={a} filmCount={filmsByArtist(a.id).length} />
        ))}
      </div>
    </main>
  );
}

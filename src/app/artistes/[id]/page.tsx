import { notFound } from "next/navigation";
import Image from "next/image";
import Card from "@/components/Card/Card";
import { getArtist, getArtists, getFilmsByArtist } from "@/db/queries";
import styles from "./artist.module.css";

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map((a) => ({ id: a.id }));
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();

  const artistFilms = await getFilmsByArtist(artist.id);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <Image src={artist.avatar} alt={artist.name} fill sizes="140px" unoptimized />
        </div>
        <div>
          <h1 className={styles.name}>{artist.name}</h1>
          <p className={styles.bio}>{artist.bio}</p>
          <p className={styles.count}>
            {artistFilms.length} film{artistFilms.length > 1 ? "s" : ""} sur ZorAnim
          </p>
        </div>
      </div>

      <div className={styles.filmsSection}>
        <h2 className={styles.filmsTitle}>Films</h2>
        <div className={styles.grid}>
          {artistFilms.map((f) => (
            <Card key={f.id} film={f} />
          ))}
        </div>
      </div>
    </main>
  );
}

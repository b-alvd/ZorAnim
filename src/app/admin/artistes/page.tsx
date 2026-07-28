import { getArtists, getFilms } from "@/db/queries";
import ArtistRowActions from "./ArtistRowActions";
import ArtistCreateButton from "./ArtistCreateButton";
import styles from "../shared.module.css";

export default async function AdminArtistesPage() {
  const [artists, films] = await Promise.all([getArtists(), getFilms()]);

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Artistes</h1>
        <ArtistCreateButton />
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Films</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {artists.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{films.filter((f) => f.artistId === a.id).length}</td>
              <td>
                <ArtistRowActions artist={a} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

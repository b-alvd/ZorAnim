import { getArtists, getFilms } from "@/db/queries";
import Pagination from "@/components/Pagination/Pagination";
import ArtistRowActions from "./ArtistRowActions";
import ArtistCreateButton from "./ArtistCreateButton";
import styles from "../shared.module.css";

const PAGE_SIZE = 20;

export default async function AdminArtistesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [allArtists, films] = await Promise.all([getArtists(), getFilms()]);

  const { page: pageParam } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(allArtists.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const artists = allArtists.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Artistes</h1>
        <ArtistCreateButton />
      </div>
      <div className={styles.tableWrap}>
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
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/admin/artistes" />
    </main>
  );
}

import { getAdminArtists, getFilmCreatedAts, getFilmEngagement, getFilms, getUsers } from "@/db/queries";
import { summarizeContents } from "../content-summary";
import ArtistCreateButton from "./ArtistCreateButton";
import ArtistsManager, { type AdminArtist, type AccountChoice } from "./ArtistsManager";
import styles from "../shared.module.css";

export default async function AdminArtistesPage() {
  const [rows, films, users, createdAts] = await Promise.all([
    getAdminArtists(),
    getFilms(),
    getUsers(),
    getFilmCreatedAts(),
  ]);
  const engagement = await getFilmEngagement(films.map((f) => f.id));

  const artists: AdminArtist[] = rows.map((a) => {
    const studioIds = new Map(a.studios.map((s) => [s.id, s.name]));
    const personal = films.filter((f) => !f.isStudioAttribution && f.artistId === a.id);
    const viaStudios = a.studios.flatMap((s) =>
      summarizeContents(
        films.filter((f) => f.isStudioAttribution && f.artistId === s.id),
        studioIds.get(s.id) ?? null,
        engagement,
        createdAts
      )
    );
    return {
      ...a,
      contents: [...summarizeContents(personal, null, engagement, createdAts), ...viaStudios],
    };
  });

  const linkedArtistByUser = new Map(rows.filter((a) => a.userId).map((a) => [a.userId!, a.name]));
  const accounts: AccountChoice[] = users
    .map((u) => ({ id: u.id, label: `${u.name} · ${u.email}`, artistName: linkedArtistByUser.get(u.id) ?? null }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Artistes</h1>
        <ArtistCreateButton accounts={accounts.filter((a) => !a.artistName)} />
      </div>
      <ArtistsManager artists={artists} accounts={accounts} />
    </main>
  );
}

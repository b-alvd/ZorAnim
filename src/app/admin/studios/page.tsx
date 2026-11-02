import { getAdminArtists, getAdminStudios, getFilmCreatedAts, getFilmEngagement, getFilms, getUsers } from "@/db/queries";
import { summarizeContents } from "../content-summary";
import StudiosManager, { type AdminStudioItem } from "./StudiosManager";
import styles from "../shared.module.css";

export default async function AdminStudiosPage() {
  const [rows, films, users, artists, createdAts] = await Promise.all([
    getAdminStudios(),
    getFilms(),
    getUsers(),
    getAdminArtists(),
    getFilmCreatedAts(),
  ]);
  const engagement = await getFilmEngagement(films.map((f) => f.id));

  const studios: AdminStudioItem[] = rows.map((s) => ({
    ...s,
    contents: summarizeContents(
      films.filter((f) => f.isStudioAttribution && f.artistId === s.id),
      null,
      engagement,
      createdAts
    ),
  }));

  // Founder candidates: every account, named after its artist profile if any.
  const artistByUser = new Map(artists.filter((a) => a.userId).map((a) => [a.userId!, a.name]));
  const accounts = users
    .map((u) => {
      const artistName = artistByUser.get(u.id);
      return { id: u.id, label: artistName ? `${artistName} (artiste) — ${u.email}` : `${u.name} — ${u.email}` };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Studios</h1>
      </div>
      <StudiosManager studios={studios} accounts={accounts} />
    </main>
  );
}

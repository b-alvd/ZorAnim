import type { FilmSubmission, ArtistSubmission } from "@/db/queries";
import styles from "./MyRequestsCard.module.css";

function formatDate(createdAt: string) {
  return new Date(createdAt.replace(" ", "T") + "Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MyRequestsCard({
  filmSubmissions,
  artistSubmissions,
}: {
  filmSubmissions: FilmSubmission[];
  artistSubmissions: ArtistSubmission[];
}) {
  const hasRequests = filmSubmissions.length > 0 || artistSubmissions.length > 0;

  if (!hasRequests) {
    return <p className={styles.empty}>Tu n&apos;as aucune demande en cours.</p>;
  }

  return (
    <div className={styles.list}>
      {filmSubmissions.map((s) => (
        <div key={s.id} className={styles.item}>
          <div className={styles.itemHeader}>
            <span className={styles.itemTitle}>{s.title}</span>
            <span className={styles.badge}>Film en attente</span>
          </div>
          <span className={styles.meta}>
            {s.category} · Envoyée le {formatDate(s.createdAt)}
          </span>
        </div>
      ))}
      {artistSubmissions.map((s) => (
        <div key={s.id} className={styles.item}>
          <div className={styles.itemHeader}>
            <span className={styles.itemTitle}>{s.name}</span>
            <span className={styles.badge}>Artiste en attente</span>
          </div>
          <span className={styles.meta}>Envoyée le {formatDate(s.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

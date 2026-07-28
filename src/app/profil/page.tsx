import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPendingArtistSubmissionsByUser, getPendingFilmSubmissionsByUser } from "@/db/queries";
import AvatarUpload from "./AvatarUpload";
import LogoutButton from "./LogoutButton";
import SettingsGrid from "./SettingsGrid";
import styles from "./profil.module.css";

function formatJoinDate(createdAt: string) {
  return new Date(createdAt.replace(" ", "T") + "Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [filmSubmissions, artistSubmissions] = await Promise.all([
    getPendingFilmSubmissionsByUser(user.id),
    getPendingArtistSubmissionsByUser(user.id),
  ]);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <AvatarUpload avatarUrl={user.avatarUrl} initials={initials} />
        <div className={styles.identity}>
          <h1 className={styles.name}>{user.name}</h1>
          <p className={styles.email}>{user.email}</p>
          <span className={styles.joinedBadge}>Membre depuis le {formatJoinDate(user.createdAt)}</span>
        </div>
        <LogoutButton />
      </div>

      <div className={styles.settingsWrap}>
        <h2 className={styles.settingsTitle}>Paramètres du compte</h2>
        <SettingsGrid
          name={user.name}
          email={user.email}
          nameChangedAt={user.nameChangedAt}
          filmSubmissions={filmSubmissions}
          artistSubmissions={artistSubmissions}
        />
      </div>
    </main>
  );
}

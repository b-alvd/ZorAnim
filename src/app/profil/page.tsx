import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import AvatarUpload from "./AvatarUpload";
import LogoutButton from "./LogoutButton";
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

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <AvatarUpload avatarUrl={user.avatarUrl} initials={initials} />
        <h1 className={styles.name}>{user.name}</h1>
        <p className={styles.email}>{user.email}</p>
        <p className={styles.joined}>Membre depuis le {formatJoinDate(user.createdAt)}</p>

        <div className={styles.section}>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}

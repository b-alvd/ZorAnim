import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import LogoutButton from "./LogoutButton";
import styles from "./profil.module.css";

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
        <div className={styles.avatar}>{initials}</div>
        <h1 className={styles.name}>{user.name}</h1>
        <p className={styles.email}>{user.email}</p>

        <div className={styles.section}>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}

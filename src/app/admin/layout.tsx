import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./admin.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <span className={styles.logo}>Admin</span>
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navLink}>
            Tableau de bord
          </Link>
          <Link href="/admin/films" className={styles.navLink}>
            Films
          </Link>
          <Link href="/admin/artistes" className={styles.navLink}>
            Artistes
          </Link>
          <Link href="/admin/utilisateurs" className={styles.navLink}>
            Utilisateurs
          </Link>
          <Link href="/admin/demandes" className={styles.navLink}>
            Demandes
          </Link>
          <Link href="/admin/messages" className={styles.navLink}>
            Messages
          </Link>
        </nav>
        <Link href="/" className={styles.back}>
          ← Retour au site
        </Link>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPendingArtistSubmissions, getPendingFilmSubmissions, getContactMessages } from "@/db/queries";
import AdminNav from "./AdminNav";
import styles from "./admin.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const [filmSubmissions, artistSubmissions, messages] = await Promise.all([
    getPendingFilmSubmissions(),
    getPendingArtistSubmissions(),
    getContactMessages(),
  ]);
  const demandesCount = filmSubmissions.length + artistSubmissions.length;
  const messagesCount = messages.filter((m) => m.status === "open").length;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.logoRow}>
          <Link href="/" className={styles.backBtn} aria-label="Retour au site">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className={styles.logo}>Admin</span>
        </div>
        <AdminNav demandesCount={demandesCount} messagesCount={messagesCount} />
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

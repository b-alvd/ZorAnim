"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import AdminNav from "./AdminNav";
import styles from "./admin.module.css";

export default function AdminShell({
  demandesCount,
  messagesCount,
  children,
}: {
  demandesCount: number;
  messagesCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className={styles.page}>
      <div className={styles.mobileTopBar}>
        <div className={styles.logoRow}>
          <Link href="/" className={styles.backBtn} aria-label="Retour au site">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className={styles.logo}>Admin</span>
        </div>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      <div className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
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

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NAV_ICONS } from "./navIcons";
import styles from "./Navbar.module.css";

export type MenuUser = { name: string; email: string; role?: string; avatarUrl?: string | null };

export const accountLinks = [
  { href: "/profil", label: "Mon profil" },
  { href: "/ma-liste", label: "Ma liste" },
  { href: "/historique", label: "Historique" },
  { href: "/mon-espace", label: "Espace créateur" },
];

export function UserAvatar({ user, size = 30 }: { user: MenuUser; size?: number }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" />
      ) : (
        user.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

// Account dropdown of the desktop navbar.
export default function UserMenu({ user, onLogout }: { user: MenuUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.userMenu} ref={ref}>
      <button
        type="button"
        className={`${styles.userBtn} ${open ? styles.userBtnOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserAvatar user={user} />
        <span className={styles.userBtnName}>{user.name}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.chevron}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHead}>
            <UserAvatar user={user} size={38} />
            <div className={styles.dropdownWho}>
              <span className={styles.dropdownName}>{user.name}</span>
              <span className={styles.dropdownEmail}>{user.email}</span>
            </div>
          </div>
          {accountLinks.map((l) => (
            <Link key={l.href} href={l.href} className={styles.dropdownItem} role="menuitem" onClick={() => setOpen(false)}>
              {NAV_ICONS[l.href]}
              {l.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <Link href="/admin" className={styles.dropdownItem} role="menuitem" onClick={() => setOpen(false)}>
              {NAV_ICONS["/admin"]}
              Administration
            </Link>
          )}
          <div className={styles.dropdownSep} />
          <button type="button" className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={onLogout} role="menuitem">
            {NAV_ICONS.logout}
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

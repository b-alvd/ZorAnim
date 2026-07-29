"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

type NavItem = { href: string; label: string; icon: React.ReactNode; badge?: number };
type NavGroup = { title: string; items: NavItem[] };

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  films: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5" />
    </svg>
  ),
  artistes: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  demandes: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v12H8l-4 4z" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  commentaires: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
      <path d="M21 12c0 4.42-4.03 8-9 8-1.18 0-2.31-.2-3.34-.56L3 21l1.67-4.17C3.62 15.61 3 13.87 3 12c0-4.42 4.03-8 9-8s9 3.58 9 8z" />
    </svg>
  ),
  utilisateurs: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  studios: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  ),
  reveal: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
};

export default function AdminNav({ demandesCount, messagesCount }: { demandesCount: number; messagesCount: number }) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      title: "Vue d'ensemble",
      items: [{ href: "/admin", label: "Tableau de bord", icon: icons.dashboard }],
    },
    {
      title: "Contenu",
      items: [
        { href: "/admin/films", label: "Films", icon: icons.films },
        { href: "/admin/artistes", label: "Artistes", icon: icons.artistes },
        { href: "/admin/studios", label: "Studios", icon: icons.studios },
      ],
    },
    {
      title: "Communauté",
      items: [
        { href: "/admin/demandes", label: "Demandes", icon: icons.demandes, badge: demandesCount },
        { href: "/admin/messages", label: "Messages", icon: icons.messages, badge: messagesCount },
        { href: "/admin/commentaires", label: "Commentaires", icon: icons.commentaires },
      ],
    },
    {
      title: "Comptes",
      items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", icon: icons.utilisateurs }],
    },
    {
      title: "Site",
      items: [{ href: "/admin/reveal", label: "Compte à rebours", icon: icons.reveal }],
    },
  ];

  return (
    <nav className={styles.nav}>
      {groups.map((group) => (
        <div key={group.title} className={styles.navGroup}>
          <span className={styles.navGroupTitle}>{group.title}</span>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
              {!!item.badge && <span className={styles.navBadge}>{item.badge}</span>}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

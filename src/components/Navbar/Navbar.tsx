"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo/Logo";
import NavSearch from "./NavSearch";
import NotificationBell from "./NotificationBell";
import { NAV_ICONS } from "./navIcons";
import UserMenu, { UserAvatar } from "./UserMenu";
import type { Notification } from "@/db/queries";
import styles from "./Navbar.module.css";

// "match" lists the other paths that belong to a tab (e.g. an artist page
// belongs to Créateurs).
const baseLinks = [
  { href: "/", label: "Accueil", match: [] as string[] },
  { href: "/catalogue", label: "Catalogue", match: [] },
  { href: "/nouveautes", label: "Nouveautés", match: [] },
  { href: "/createurs", label: "Créateurs", match: ["/artistes", "/studios"] },
];
const myListLink = { href: "/ma-liste", label: "Ma liste", match: [] as string[] };

type NavbarUser = { id: string; email: string; name: string; role?: string; avatarUrl?: string | null } | null;

export default function Navbar({
  user,
  notifications = [],
  unreadCount = 0,
}: {
  user: NavbarUser;
  notifications?: Notification[];
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Closes the mobile menu after navigating (state adjusted during render
  // rather than in an effect).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const scrollY = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  const under = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isActive = (l: { href: string; match: string[] }) =>
    l.href === "/" ? pathname === "/" : under(l.href) || l.match.some(under);
  const links = user ? [...baseLinks, myListLink] : baseLinks;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (pathname.startsWith("/watch/") || pathname.startsWith("/admin")) return null;

  return (
    <header className={styles.header}>
      <div className={`${styles.headerBg} ${scrolled ? styles.scrolled : ""}`} />
      <div className={styles.bar}>
        <Link href="/" aria-label="ZorAnim, accueil">
          <Logo />
        </Link>
        <nav className={styles.nav}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`${styles.link} ${isActive(l) ? styles.active : ""}`}
            >
              <span className={styles.linkIcon}>{NAV_ICONS[l.href]}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <NavSearch />
        <div className={styles.account}>
          {user ? (
            <>
              <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Link href="/connexion" className={styles.loginLink}>
                Connexion
              </Link>
              <Link href="/inscription" className={styles.signupLink}>
                Inscription
              </Link>
            </>
          )}
        </div>
        <div className={styles.mobileActions}>
          {user && <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />}
          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className={`${styles.bun} ${menuOpen ? styles.bunOpenTop : ""}`} />
            <span className={`${styles.bun} ${menuOpen ? styles.bunOpenMid : ""}`} />
            <span className={`${styles.bun} ${menuOpen ? styles.bunOpenBottom : ""}`} />
          </button>
        </div>
      </div>

      <div className={styles.backdrop} data-open={menuOpen} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <nav className={styles.mobileMenu} data-open={menuOpen} aria-label="Menu principal">
        <NavSearch mobile onNavigate={() => setMenuOpen(false)} />

        <div className={styles.mobileLinks}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`${styles.mobileLink} ${isActive(l) ? styles.mobileActive : ""}`}
            >
              <span className={styles.mobileIcon}>{NAV_ICONS[l.href]}</span>
              {l.label}
            </Link>
          ))}
        </div>

        {user ? (
          <div className={styles.mobileAccount}>
            <Link href="/profil" className={styles.mobileWho}>
              <UserAvatar user={user} size={42} />
              <span className={styles.mobileWhoText}>
                <span className={styles.dropdownName}>{user.name}</span>
                <span className={styles.mobileWhoHint}>Voir mon profil</span>
              </span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
            <div className={styles.mobileTiles}>
              {[
                { href: "/historique", label: "Historique" },
                { href: "/mon-espace", label: "Espace créateur" },
                ...(user.role === "admin" ? [{ href: "/admin", label: "Administration" }] : []),
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`${styles.mobileTile} ${under(l.href) ? styles.mobileTileActive : ""}`}
                >
                  {NAV_ICONS[l.href]}
                  {l.label}
                </Link>
              ))}
            </div>
            <button type="button" className={styles.mobileLogout} onClick={handleLogout}>
              {NAV_ICONS.logout}
              Se déconnecter
            </button>
          </div>
        ) : (
          <div className={styles.mobileGuest}>
            <p>Connecte-toi pour reprendre tes programmes et garder ta liste.</p>
            <div className={styles.mobileGuestBtns}>
              <Link href="/connexion" className={styles.loginLink}>
                Connexion
              </Link>
              <Link href="/inscription" className={styles.signupLink}>
                Inscription
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

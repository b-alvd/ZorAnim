"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo/Logo";
import styles from "./Navbar.module.css";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/nouveautes", label: "Nouveautés" },
  { href: "/categories", label: "Catégories" },
  { href: "/artistes", label: "Artistes" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (pathname.startsWith("/watch/")) return null;

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
              className={`${styles.link} ${pathname === l.href ? styles.active : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
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

      <div className={styles.backdrop} data-open={menuOpen} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <nav className={styles.mobileMenu} data-open={menuOpen}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.mobileLink} ${pathname === l.href ? styles.mobileActive : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

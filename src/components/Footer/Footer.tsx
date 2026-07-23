"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo/Logo";
import styles from "./Footer.module.css";

const columns = [
  {
    title: "Explorer",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Catalogue", href: "/catalogue" },
      { label: "Nouveautés", href: "/nouveautes" },
      { label: "Catégories", href: "/categories" },
      { label: "Artistes", href: "/artistes" },
    ],
  },
  {
    title: "Communauté",
    links: [
      { label: "Soumettre un film", href: "/soumettre-un-film" },
      { label: "Devenir artiste", href: "/devenir-artiste" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Aide", href: "/aide" },
      { label: "Contact", href: "/contact" },
      { label: "Conditions d'utilisation", href: "/conditions-utilisation" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/watch/")) return null;

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <Logo />
        <p className={styles.tagline}>Créer. Rêver. Partager.</p>
      </div>

      <div className={styles.grid}>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className={styles.colTitle}>{col.title}</h3>
            <ul className={styles.list}>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.bottom}>
        <p className={styles.copy}>
          © {new Date().getFullYear()}
          {" "}
          ZorAnim. Une plateforme pour l&apos;animation indépendante.
        </p>
        <p className={styles.credit}>Développé par b-alvd</p>
      </div>
    </footer>
  );
}

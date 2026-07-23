"use client";

import { usePathname } from "next/navigation";
import Logo from "@/components/Logo/Logo";
import styles from "./Footer.module.css";

const columns = [
  {
    title: "Explorer",
    links: ["Accueil", "Catalogue", "Nouveautés", "Catégories"],
  },
  {
    title: "Communauté",
    links: ["Soumettre un film", "Devenir artiste"],
  },
  {
    title: "Support",
    links: ["Aide", "Conditions d'utilisation", "Confidentialité"],
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
                <li key={l}>
                  <a href="#">{l}</a>
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

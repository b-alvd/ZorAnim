import type { ReactNode } from "react";
import styles from "./InfoPage.module.css";

export default function InfoPage({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {updated && <p className={styles.updated}>Dernière mise à jour : {updated}</p>}
        </div>
      </div>
      <div className={styles.wrap}>
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}

import type { ReactNode } from "react";
import styles from "./SettingsCard.module.css";

export default function SettingsCard({
  title,
  icon,
  danger,
  wide,
  children,
}: {
  title: string;
  icon: ReactNode;
  danger?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.card} ${danger ? styles.danger : ""} ${wide ? styles.wide : ""}`}>
      <div className={styles.header}>
        <span className={`${styles.icon} ${danger ? styles.iconDanger : ""}`}>{icon}</span>
        <h3 className={styles.title}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

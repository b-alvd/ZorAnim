import type { ReactNode } from "react";
import styles from "./SettingsCard.module.css";

export default function SettingsCard({
  title,
  icon,
  danger,
  wide,
  span2,
  children,
}: {
  title: string;
  icon: ReactNode;
  danger?: boolean;
  wide?: boolean;
  span2?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`${styles.card} ${danger ? styles.danger : ""} ${wide ? styles.wide : ""} ${
        span2 ? styles.span2 : ""
      }`}
    >
      <div className={styles.header}>
        <span className={`${styles.icon} ${danger ? styles.iconDanger : ""}`}>{icon}</span>
        <h3 className={styles.title}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

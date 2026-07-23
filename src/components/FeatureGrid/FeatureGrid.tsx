import type { ReactNode } from "react";
import styles from "./FeatureGrid.module.css";

export type Feature = { icon: ReactNode; title: string; description: string };

export default function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className={styles.grid}>
      {features.map((f) => (
        <div key={f.title} className={styles.card}>
          <span className={styles.icon}>{f.icon}</span>
          <p className={styles.title}>{f.title}</p>
          <p className={styles.description}>{f.description}</p>
        </div>
      ))}
    </div>
  );
}

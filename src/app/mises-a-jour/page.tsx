import HelpCenter from "@/components/HelpCenter/HelpCenter";
import { CHANGELOG, CURRENT_VERSION } from "@/lib/changelog";
import styles from "./changelog.module.css";

export const metadata = {
  title: "Mises à jour | ZorAnim",
};

export default function ChangelogPage() {
  return (
    <HelpCenter
      active="mises-a-jour"
      title="Mises à jour"
      subtitle="Tout ce qui a changé sur ZorAnim, version après version."
    >
      <div className={styles.current}>
        <span className={styles.currentDot} aria-hidden="true" />
        Version actuelle <strong>v{CURRENT_VERSION}</strong>
        <span className={styles.currentDate}>· {CHANGELOG[0].date}</span>
      </div>

      <ol className={styles.timeline}>
        {CHANGELOG.map((entry, i) => (
          <li key={entry.version} className={`${styles.entry} ${i === 0 ? styles.entryLatest : ""}`}>
            <span className={styles.marker} aria-hidden="true" />
            <div className={styles.card}>
              <div className={styles.entryHeader}>
                <span className={styles.version}>v{entry.version}</span>
                {i === 0 && <span className={styles.latestBadge}>Dernière version</span>}
                <span className={styles.date}>{entry.date}</span>
              </div>
              <ul className={styles.changes}>
                {entry.changes.map((change, j) => (
                  <li key={j}>{change}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </HelpCenter>
  );
}

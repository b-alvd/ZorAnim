import InfoPage from "@/components/InfoPage/InfoPage";
import { CHANGELOG, CURRENT_VERSION } from "@/lib/changelog";
import styles from "./changelog.module.css";

export const metadata = {
  title: "Mises à jour | ZorAnim",
};

export default function ChangelogPage() {
  return (
    <InfoPage title="Mises à jour" subtitle={`Ce qui a changé sur ZorAnim au fil du temps. Version actuelle : v${CURRENT_VERSION}.`}>
      {CHANGELOG.map((entry) => (
        <div key={entry.version} className={styles.entry}>
          <div className={styles.entryHeader}>
            <span className={styles.version}>v{entry.version}</span>
            <span className={styles.date}>{entry.date}</span>
          </div>
          <ul>
            {entry.changes.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
      ))}
    </InfoPage>
  );
}

import type { Film } from "@/data/mock";
import styles from "./Card.module.css";

export default function Card({ film }: { film: Film }) {
  return (
    <div className={styles.card}>
      <div className={styles.inner}>
        <span className={styles.title}>{film.title}</span>
      </div>
    </div>
  );
}

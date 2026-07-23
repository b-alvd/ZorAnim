import Image from "next/image";
import type { Film } from "@/data/mock";
import styles from "./Card.module.css";

export default function Card({ film }: { film: Film }) {
  return (
    <div className={styles.card}>
      <Image
        src={film.poster}
        alt={film.title}
        fill
        sizes="340px"
        className={styles.bg}
        unoptimized
      />
      <span className={styles.title}>{film.title}</span>
    </div>
  );
}

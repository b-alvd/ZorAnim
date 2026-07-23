import Card from "@/components/Card/Card";
import type { Film } from "@/data/mock";
import styles from "./Row.module.css";

export default function Row({ title, films }: { title: string; films: Film[] }) {
  return (
    <section className={styles.row}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.track}>
        {films.map((f) => (
          <Card key={f.id} film={f} />
        ))}
      </div>
    </section>
  );
}

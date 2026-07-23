import Card from "@/components/Card/Card";
import { films } from "@/data/mock";
import styles from "./catalogue.module.css";

export default function CataloguePage() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Catalogue</h1>
        <p className={styles.subtitle}>
          {films.length} film{films.length > 1 ? "s" : ""} disponible{films.length > 1 ? "s" : ""}
        </p>
      </div>
      <div className={styles.grid}>
        {films.map((f) => (
          <Card key={f.id} film={f} />
        ))}
      </div>
    </main>
  );
}

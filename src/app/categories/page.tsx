import Row from "@/components/Row/Row";
import { categories, films } from "@/data/mock";
import styles from "./categories.module.css";

export default function CategoriesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Catégories</h1>
        <p className={styles.subtitle}>
          {categories.length} catégorie{categories.length > 1 ? "s" : ""} à explorer
        </p>
      </div>
      {categories.map((cat) => (
        <Row key={cat} title={cat} films={films.filter((f) => f.category === cat)} cardWidth={300} />
      ))}
    </main>
  );
}

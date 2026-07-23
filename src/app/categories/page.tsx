import Card from "@/components/Card/Card";
import { categories, films } from "@/data/mock";
import gridStyles from "../catalogue/catalogue.module.css";
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
      {categories.map((cat) => {
        const catFilms = films.filter((f) => f.category === cat);
        return (
          <section key={cat} className={styles.section}>
            <h2 className={styles.sectionTitle}>{cat}</h2>
            <div className={gridStyles.grid}>
              {catFilms.map((f) => (
                <Card key={f.id} film={f} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import { getFilms } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./catalogue.module.css";

export default async function CataloguePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const films = await getFilms();

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

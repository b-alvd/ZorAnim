import { redirect } from "next/navigation";
import Card from "@/components/Card/Card";
import { getNewFilms } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "../catalogue/catalogue.module.css";

export default async function NouveautesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const newFilms = await getNewFilms();

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Nouveautés</h1>
        <p className={styles.subtitle}>
          {newFilms.length > 0
            ? `${newFilms.length} nouveau${newFilms.length > 1 ? "x" : ""} film${newFilms.length > 1 ? "s" : ""}`
            : "Rien de nouveau pour l'instant"}
        </p>
      </div>
      {newFilms.length > 0 ? (
        <div className={styles.grid}>
          {newFilms.map((f) => (
            <Card key={f.id} film={f} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Reviens bientôt pour découvrir les prochains ajouts.</p>
      )}
    </main>
  );
}

import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.text}>
        Ce film s&apos;est échappé du catalogue, ou l&apos;adresse est incorrecte.
      </p>
      <Link href="/" className={styles.cta}>
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}

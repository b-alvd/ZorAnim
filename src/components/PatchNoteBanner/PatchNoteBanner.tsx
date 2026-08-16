import styles from "./PatchNoteBanner.module.css";

export default function PatchNoteBanner({ title, message }: { title: string | null; message: string }) {
  return (
    <section className={styles.banner}>
      <div className={styles.icon}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6z" />
        </svg>
      </div>
      <div className={styles.body}>
        {title && <h2 className={styles.title}>{title}</h2>}
        <p className={styles.message}>{message}</p>
      </div>
    </section>
  );
}

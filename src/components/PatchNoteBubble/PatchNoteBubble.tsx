import styles from "./PatchNoteBubble.module.css";

export default function PatchNoteBubble({ title, message }: { title: string | null; message: string }) {
  return (
    <section className={styles.wrap}>
      <div className={styles.bubble}>
        <div className={styles.icon}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6z" />
          </svg>
        </div>
        <div className={styles.body}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <p className={styles.message}>{message}</p>
        </div>
      </div>
    </section>
  );
}

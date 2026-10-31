import styles from "./ViewerCounter.module.css";

export default function ViewerCounter({ count }: { count: number }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.dot} />
      {count}
      <span className={styles.label}>{count > 1 ? "spectateurs" : "spectateur"} en direct</span>
    </div>
  );
}

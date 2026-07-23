import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.shade} />
      <div className={styles.content}>
        <h1 className={styles.title}>ZorAnim</h1>
        <p className={styles.tagline}>Créer. Rêver. Partager.</p>
        <div className={styles.actions}>
          <button className={styles.playBtn}>▶ Lecture</button>
          <button className={styles.infoBtn}>ⓘ Plus d&apos;infos</button>
        </div>
      </div>
    </section>
  );
}

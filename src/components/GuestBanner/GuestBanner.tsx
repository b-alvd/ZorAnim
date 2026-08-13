import Link from "next/link";
import styles from "./GuestBanner.module.css";

export default function GuestBanner() {
  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        Tu navigues en tant qu'invité, tu peux parcourir le catalogue et regarder librement.{" "}
        <Link href="/inscription" className={styles.link}>
          Crée un compte gratuit
        </Link>{" "}
        pour noter, commenter et sauvegarder des favoris.
      </p>
    </div>
  );
}

import Image from "next/image";
import styles from "./Logo.module.css";

export default function Logo() {
  return (
    <Image
      src="/logo-text.png"
      alt="ZorAnim"
      width={600}
      height={160}
      className={styles.logo}
      priority
    />
  );
}

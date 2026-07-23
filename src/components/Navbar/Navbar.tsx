import Logo from "@/components/Logo/Logo";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <header className={styles.header}>
      <Logo />
    </header>
  );
}

"use client";

import { useRouter } from "next/navigation";
import styles from "./profil.module.css";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button className={styles.logoutBtn} onClick={handleLogout}>
      Se déconnecter
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

export default function NavSearch({ onNavigate, mobile }: { onNavigate?: () => void; mobile?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/catalogue?q=${encodeURIComponent(q)}` : "/catalogue");
    onNavigate?.();
  };

  return (
    <form
      className={`${styles.navSearch} ${mobile ? styles.navSearchMobile : ""}`}
      onSubmit={handleSubmit}
      role="search"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" className={styles.navSearchIcon}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher..."
        className={styles.navSearchInput}
        aria-label="Rechercher un film, une série, un artiste"
      />
    </form>
  );
}

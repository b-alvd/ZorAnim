"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./CookieConsent.module.css";

const STORAGE_KEY = "zoranim-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        ZorAnim utilise uniquement un cookie de session, strictement nécessaire pour te garder
        connecté à ton compte. Aucun cookie de suivi publicitaire n&apos;est utilisé. En continuant,
        tu acceptes notre{" "}
        <Link href="/confidentialite" className={styles.link}>
          politique de confidentialité
        </Link>{" "}
        et nos{" "}
        <Link href="/conditions-utilisation" className={styles.link}>
          conditions d&apos;utilisation
        </Link>
        .
      </p>
      <button type="button" className={styles.acceptBtn} onClick={accept}>
        J&apos;ai compris
      </button>
    </div>
  );
}

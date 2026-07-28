"use client";

import { getPasswordChecks } from "@/lib/auth/validate";
import styles from "./PasswordChecklist.module.css";

export default function PasswordChecklist({ password }: { password: string }) {
  const checks = getPasswordChecks(password);

  return (
    <ul className={styles.list}>
      {checks.map((check) => (
        <li key={check.label} className={`${styles.item} ${check.passed ? styles.passed : ""}`}>
          <span className={styles.icon}>
            {check.passed ? (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="8" />
              </svg>
            )}
          </span>
          {check.label}
        </li>
      ))}
    </ul>
  );
}

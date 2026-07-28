"use client";

import { useState } from "react";
import styles from "./PasswordField.module.css";

export default function PasswordField({
  value,
  onChange,
  placeholder,
  minLength,
  className,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  className: string;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrap}>
      <input
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className={className}
        placeholder={placeholder}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M4 4l16 16" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

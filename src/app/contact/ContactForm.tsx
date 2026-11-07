"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitContactAction } from "./actions";
import styles from "./contact.module.css";

// Kept in sync with MAX_MESSAGE_LENGTH in actions.ts (a server file).
const MAX_LENGTH = 3000;

const SUBJECTS = [
  {
    value: "Question générale",
    hint: "Le site, ton compte, un contenu",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: "Bug ou problème technique",
    hint: "Précise la page et ton navigateur",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
        <rect x="6" y="8" width="12" height="12" rx="6" />
        <path d="M12 12v4M3 13h3M18 13h3M4 7l2 2M20 7l-2 2" />
      </svg>
    ),
  },
  {
    value: "Faire une suggestion",
    hint: "Une idée pour améliorer ZorAnim",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />
      </svg>
    ),
  },
  {
    value: "Partenariat",
    hint: "Collaboration, événement, presse",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 17l2 2a1.4 1.4 0 0 0 2-2" />
        <path d="M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2L15 11l-1 1a2 2 0 0 1-3-3l2.5-2.5a3 3 0 0 1 3.5-.5l3 1.5V14" />
        <path d="M3 7.5l3-1.5a3 3 0 0 1 3.5.5L10 7M3 14V7.5M3 14l5.5 5.5a1.4 1.4 0 0 0 2-2" />
      </svg>
    ),
  },
];

export default function ContactForm({ name, email }: { name: string; email: string }) {
  const [subject, setSubject] = useState(SUBJECTS[0].value);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitContactAction({ subject, message });
      if (result.error) setError(result.error);
      else setSent(true);
    });
  };

  if (sent) {
    return (
      <div className={styles.sent}>
        <span className={styles.sentIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
        <h2>Message envoyé</h2>
        <p>Merci {name} ! La réponse de l&apos;équipe apparaîtra dans ton profil, et tu seras prévenu par une notification.</p>
        <div className={styles.sentActions}>
          <Link href="/profil" className={styles.primaryBtn}>
            Voir mes messages
          </Link>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => {
              setMessage("");
              setSent(false);
            }}
          >
            Écrire un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.identity}>
        <span className={styles.identityLabel}>Envoyé en tant que</span>
        <span className={styles.identityValue}>
          {name} · {email}
        </span>
      </div>

      <fieldset className={styles.subjects}>
        <legend className={styles.label}>Sujet</legend>
        <div className={styles.subjectGrid}>
          {SUBJECTS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`${styles.subject} ${subject === s.value ? styles.subjectActive : ""}`}
              onClick={() => setSubject(s.value)}
              aria-pressed={subject === s.value}
            >
              <span className={styles.subjectIcon}>{s.icon}</span>
              <span className={styles.subjectText}>
                <strong>{s.value}</strong>
                <span>{s.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className={styles.field}>
        <span className={styles.labelRow}>
          <span className={styles.label}>Message</span>
          <span className={`${styles.counter} ${message.length > MAX_LENGTH ? styles.counterOver : ""}`}>
            {message.length} / {MAX_LENGTH}
          </span>
        </span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={styles.textarea}
          placeholder="Écris ton message ici…"
          rows={8}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isPending || !message.trim() || message.length > MAX_LENGTH}
        >
          {isPending ? "Envoi…" : "Envoyer le message"}
        </button>
      </div>
    </form>
  );
}

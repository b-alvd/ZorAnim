"use client";

import { useState, useTransition } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import { submitContactAction } from "./actions";
import styles from "./contact.module.css";

const subjects = ["Question générale", "Bug ou problème technique", "Proposer un film", "Partenariat"];

export default function ContactForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitContactAction({ name, email, subject, message });
        setSent(true);
      } catch {
        setError("Échec de l'envoi. Réessaie.");
      }
    });
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <p className={styles.successTitle}>Message envoyé</p>
        <p className={styles.successText}>Merci {name || "à toi"}, on revient vers toi dès que possible.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Nom</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Ton nom"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="ton@email.com"
          />
        </label>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Sujet</span>
        <Dropdown options={subjects} value={subject} onChange={setSubject} />
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Message</span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={styles.textarea}
          placeholder="Ton message..."
          rows={6}
        />
      </label>
      {error && <p className={styles.successText}>{error}</p>}
      <button type="submit" className={styles.cta} disabled={isPending}>
        {isPending ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Dropdown from "@/components/Dropdown/Dropdown";
import styles from "./contact.module.css";

const subjects = [
  "Question générale",
  "Bug ou problème technique",
  "Proposer un film",
  "Partenariat",
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  // No backend yet: this only simulates a submission locally, nothing is
  // actually sent or stored anywhere. Wire up a real endpoint later.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Contact</h1>
          <p className={styles.subtitle}>
            Une question, une suggestion, un film à proposer ? Écris-nous, on te répond dès que
            possible.
          </p>
        </div>
      </div>

      <div className={styles.wrap}>
        <aside className={styles.side}>
          <div className={styles.infoBlock}>
            <span className={`${styles.bubble} ${styles.bubbleClock}`}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </span>
            <div>
              <span className={styles.infoLabel}>Délai de réponse</span>
              <span className={styles.infoValue}>2 à 3 jours ouvrés</span>
            </div>
          </div>
          <div className={styles.infoBlock}>
            <span className={`${styles.bubble} ${styles.bubblePurple}`}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A5.2 5.2 0 0 0 22 10.2C22 5.7 17.5 2 12 2z" />
                <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
                <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
                <circle cx="15.5" cy="7.5" r="1" fill="currentColor" />
              </svg>
            </span>
            <div>
              <span className={styles.infoLabel}>Tu es artiste ?</span>
              <Link href="/devenir-artiste" className={styles.infoBtn}>
                C'est par ici
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
          <div className={styles.infoBlock}>
            <span className={`${styles.bubble} ${styles.bubbleBlue}`}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v12H8l-4 4z" />
              </svg>
            </span>
            <div>
              <span className={styles.infoLabel}>Une question fréquente ?</span>
              <Link href="/aide" className={styles.infoBtn}>
                Consulter l&apos;aide
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </aside>

        <div className={styles.panel}>
          {sent ? (
            <div className={styles.success}>
              <p className={styles.successTitle}>Message envoyé</p>
              <p className={styles.successText}>
                Merci {name || "à toi"}, on revient vers toi dès que possible.
              </p>
            </div>
          ) : (
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
              <button type="submit" className={styles.cta}>
                Envoyer
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

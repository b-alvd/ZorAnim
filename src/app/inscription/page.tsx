"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "@/components/PasswordField/PasswordField";
import styles from "./auth.module.css";

export default function InscriptionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Créer un compte</h1>
        <p className={styles.subtitle}>Rejoins ZorAnim pour suivre tes films préférés.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
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
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Mot de passe</span>
            <PasswordField
              value={password}
              onChange={setPassword}
              minLength={8}
              className={styles.input}
              placeholder="8 caractères minimum"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.cta} disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className={styles.switch}>
          Déjà un compte ? <Link href="/connexion">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}

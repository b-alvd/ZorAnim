"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordField from "@/components/PasswordField/PasswordField";
import styles from "./settings.module.css";

export default function EmailForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la mise à jour.");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
      />
      <PasswordField
        value={currentPassword}
        onChange={setCurrentPassword}
        className={styles.input}
        placeholder="Mot de passe actuel"
      />
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>Email mis à jour.</p>}
      <button type="submit" className={styles.saveBtn} disabled={loading}>
        {loading ? "..." : "Mettre à jour l'email"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import PasswordField from "@/components/PasswordField/PasswordField";
import PasswordChecklist from "@/components/PasswordChecklist/PasswordChecklist";
import styles from "./settings.module.css";

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la mise à jour.");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <PasswordField
        value={currentPassword}
        onChange={setCurrentPassword}
        className={styles.input}
        placeholder="Mot de passe actuel"
      />
      <PasswordField
        value={newPassword}
        onChange={setNewPassword}
        onFocus={() => setNewPasswordFocused(true)}
        onBlur={() => setNewPasswordFocused(false)}
        minLength={8}
        className={styles.input}
        placeholder="Nouveau mot de passe"
      />
      {newPasswordFocused && <PasswordChecklist password={newPassword} />}
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>Mot de passe mis à jour.</p>}
      <button type="submit" className={styles.saveBtn} disabled={loading}>
        {loading ? "..." : "Changer le mot de passe"}
      </button>
    </form>
  );
}

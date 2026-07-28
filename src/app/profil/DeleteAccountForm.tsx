"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordField from "@/components/PasswordField/PasswordField";
import styles from "./settings.module.css";

export default function DeleteAccountForm() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la suppression.");
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

  if (!confirming) {
    return (
      <div className={styles.dangerZone}>
        <p className={styles.dangerText}>
          Cette action est définitive : ton compte et tes données seront supprimés sans possibilité
          de retour en arrière.
        </p>
        <button type="button" className={styles.dangerBtn} onClick={() => setConfirming(true)}>
          Supprimer mon compte
        </button>
      </div>
    );
  }

  return (
    <form className={styles.dangerZone} onSubmit={handleDelete}>
      <h2 className={styles.sectionTitle}>Confirmer la suppression</h2>
      <p className={styles.dangerText}>
        Entre ton mot de passe pour confirmer. Cette action ne peut pas être annulée.
      </p>
      <PasswordField
        value={password}
        onChange={setPassword}
        className={styles.input}
        placeholder="Mot de passe"
      />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.dangerActions}>
        <button type="submit" className={styles.dangerBtn} disabled={loading}>
          {loading ? "Suppression..." : "Confirmer la suppression"}
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => {
            setConfirming(false);
            setPassword("");
            setError(null);
          }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

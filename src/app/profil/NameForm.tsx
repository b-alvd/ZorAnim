"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";

const NAME_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

function getNextAllowedDate(nameChangedAt: string | null): Date | null {
  if (!nameChangedAt) return null;
  const lastChange = new Date(nameChangedAt).getTime();
  if (Number.isNaN(lastChange)) return null;
  const nextAllowed = lastChange + NAME_COOLDOWN_MS;
  return nextAllowed > Date.now() ? new Date(nextAllowed) : null;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NameForm({
  initialName,
  nameChangedAt,
}: {
  initialName: string;
  nameChangedAt: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const nextAllowedDate = getNextAllowedDate(nameChangedAt);
  const locked = nextAllowedDate !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la mise à jour.");
        return;
      }
      setSuccess(true);
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
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
        disabled={locked}
      />
      <p className={styles.caption}>Visible sur ton profil et par les autres membres de ZorAnim.</p>
      <div className={`${styles.status} ${locked ? styles.statusLocked : styles.statusOk}`}>
        <span className={styles.statusDot} />
        {locked
          ? `Tu as modifié ton pseudo il y a moins de 3 jours, prochaine modification possible le ${formatDate(nextAllowedDate)}.`
          : "Modification possible."}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>Pseudo mis à jour.</p>}
      <button type="submit" className={styles.saveBtn} disabled={loading || locked}>
        {loading ? "..." : "Enregistrer"}
      </button>
    </form>
  );
}

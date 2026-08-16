"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo/Logo";
import { submitBanAppealAction } from "@/lib/actions";
import styles from "./BanGate.module.css";

export default function BanGate({
  banReason,
  appealStatus,
  appealMessage,
}: {
  banReason: string | null;
  appealStatus: "pending" | "accepted" | "rejected" | null;
  appealMessage: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(appealStatus);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitBanAppealAction(message);
        setStatus("pending");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Logo />
        </div>
        <div className={styles.rule} />

        <h1 className={styles.title}>Compte banni</h1>
        {banReason && (
          <p className={styles.reason}>
            <strong>Raison :</strong> {banReason}
          </p>
        )}

        {status === "pending" ? (
          <p className={styles.status}>
            Ta demande de déban a bien été envoyée. L&apos;équipe l&apos;examinera dès que possible.
          </p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {status === "rejected" && (
              <p className={styles.statusRejected}>
                Ta précédente demande a été refusée{appealMessage ? ` (« ${appealMessage} »)` : ""}. Tu peux en
                envoyer une nouvelle.
              </p>
            )}
            <label htmlFor="appealMessage" className={styles.label}>
              Tu peux faire une demande de déban. Explique nous ta situation. Nous te répondrons sous 24 à 48 heures.
            </label>
            <textarea
              id="appealMessage"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explique pourquoi tu penses que ce bannissement devrait être levé..."
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submitBtn} disabled={isPending || !message.trim()}>
              {isPending ? "Envoi…" : "Envoyer la demande"}
            </button>
          </form>
        )}

        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

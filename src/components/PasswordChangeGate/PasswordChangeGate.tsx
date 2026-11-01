"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo/Logo";
import PasswordChecklist from "@/components/PasswordChecklist/PasswordChecklist";
import { isValidPassword } from "@/lib/auth/validate";
import styles from "@/components/BanGate/BanGate.module.css";
import gateStyles from "./PasswordChangeGate.module.css";

// Full-screen gate shown after a staff password reset: nothing else on the
// site is reachable until a new password is chosen (same idea as BanGate).
export default function PasswordChangeGate({ userName }: { userName: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Une erreur est survenue.");
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
      setPending(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Logo />
        </div>
        <div className={styles.rule} />

        <h1 className={styles.title}>Choisis un nouveau mot de passe</h1>
        <p className={styles.reason}>
          Salut <strong>{userName}</strong> ! Ton mot de passe a été réinitialisé par l&apos;équipe. Pour continuer,
          choisis-en un nouveau que toi seul connais.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="newPassword" className={styles.label}>
            Nouveau mot de passe
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className={gateStyles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordChecklist password={password} />
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirme le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={gateStyles.input}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={pending || !isValidPassword(password) || !confirm}
          >
            {pending ? "Enregistrement…" : "Enregistrer et continuer"}
          </button>
        </form>

        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Modal from "@/components/Modal/Modal";
import shared from "./shared.module.css";
import styles from "./inbox.module.css";

const DAY = 24 * 60 * 60 * 1000;

// Dates come as ISO strings or as SQLite "YYYY-MM-DD HH:MM:SS" (UTC).
export function parseDate(at: string): Date {
  return new Date(at.includes("T") ? at : `${at.replace(" ", "T")}Z`);
}

export function formatDay(at: string): string {
  return parseDate(at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

// Relative label against a "now" given by the server (same text on both sides).
export function formatAgo(at: string, now: number): string {
  const minutes = Math.round((now - parseDate(at).getTime()) / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor((now - parseDate(at).getTime()) / DAY);
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} jours`;
  return formatDay(at);
}

export function Avatar({ src, name }: { src?: string | null; name: string }) {
  return (
    <span className={styles.avatar}>
      {src ? <Image src={src} alt="" fill sizes="40px" unoptimized /> : name.charAt(0).toUpperCase()}
    </span>
  );
}

export type ActionResult = { error?: string } | void;

// A confirm dialog whose action may return { error } instead of throwing
// (thrown messages are hidden by Next.js in production).
export function ConfirmButton({
  label,
  icon,
  className,
  title,
  text,
  confirmLabel,
  danger,
  action,
}: {
  label: string;
  icon?: React.ReactNode;
  className: string;
  title: string;
  text: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  action: () => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {icon}
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className={shared.confirmText}>{text}</p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={shared.confirmActions}>
          <button type="button" className={shared.cancelBtn} onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </button>
          <button
            type="button"
            className={danger ? shared.confirmDeleteBtn : shared.submitBtn}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await action();
                if (result && result.error) setError(result.error);
                else setOpen(false);
              })
            }
          >
            {isPending ? "…" : confirmLabel}
          </button>
        </div>
      </Modal>
    </>
  );
}

export const CheckIcon = (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const CrossIcon = (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

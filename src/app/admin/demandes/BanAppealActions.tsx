"use client";

import { useTransition } from "react";
import { acceptBanAppealAction, rejectBanAppealAction } from "./actions";
import styles from "../shared.module.css";

export default function BanAppealActions({ appealId }: { appealId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.rowActions}>
      <button
        type="button"
        className={styles.linkBtn}
        disabled={isPending}
        onClick={() => startTransition(() => acceptBanAppealAction(appealId))}
      >
        Accepter (débannir)
      </button>
      <button
        type="button"
        className={styles.deleteBtn}
        disabled={isPending}
        onClick={() => startTransition(() => rejectBanAppealAction(appealId))}
      >
        Refuser
      </button>
    </div>
  );
}

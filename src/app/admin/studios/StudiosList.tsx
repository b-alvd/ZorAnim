"use client";

import { useState, useTransition } from "react";
import ConfirmActionButton from "../ConfirmActionButton";
import { adminDeleteStudioAction, adminRemoveStudioMemberAction } from "./actions";
import type { AdminStudio, StudioMemberInfo } from "@/db/queries";
import styles from "./StudiosList.module.css";

type StudioWithMembers = AdminStudio & { members: StudioMemberInfo[] };

function StudioRow({ studio }: { studio: StudioWithMembers }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.row}>
      <div className={styles.rowHeader}>
        {studio.members.length > 0 ? (
          <button type="button" className={styles.expandBtn} onClick={() => setExpanded((e) => !e)}>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <span className={styles.expandSpacer} />
        )}
        <span className={styles.name}>{studio.name}</span>
        <span className={styles.owner}>
          {studio.ownerName ? `${studio.ownerName} (${studio.ownerEmail})` : "Sans propriétaire"}
        </span>
        <div className={styles.stats}>
          <span className={styles.stat}>
            {studio.memberCount} membre{studio.memberCount > 1 ? "s" : ""}
          </span>
          <span className={styles.stat}>
            {studio.filmCount} film{studio.filmCount > 1 ? "s" : ""}
          </span>
        </div>
        <ConfirmActionButton
          label="Supprimer"
          confirmTitle="Supprimer le studio"
          confirmText={`Supprimer "${studio.name}" ? Ses ${studio.filmCount} film(s) et ses membres seront aussi supprimés. Action irréversible.`}
          confirmLabel="Supprimer"
          variant="danger"
          action={adminDeleteStudioAction.bind(null, studio.id)}
        />
      </div>

      {expanded && studio.members.length > 0 && (
        <div className={styles.members}>
          {studio.members.map((m) => (
            <div key={m.id} className={styles.member}>
              <span>{m.name}</span>
              <span className={`${styles.memberBadge} ${m.status === "active" ? styles.memberBadgeActive : ""}`}>
                {m.status === "active" ? "Actif" : "Invité"}
              </span>
              <button
                type="button"
                className={styles.memberRemove}
                disabled={isPending}
                onClick={() => startTransition(() => adminRemoveStudioMemberAction(m.id))}
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudiosList({ studios }: { studios: StudioWithMembers[] }) {
  if (studios.length === 0) {
    return <p className={styles.empty}>Aucun studio pour l&apos;instant.</p>;
  }

  return (
    <div className={styles.list}>
      {studios.map((s) => (
        <StudioRow key={s.id} studio={s} />
      ))}
    </div>
  );
}

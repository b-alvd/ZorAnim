"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestToJoinStudioAction } from "@/app/studios/[id]/actions";
import styles from "./RequestToJoinButton.module.css";

export default function RequestToJoinButton({
  studioId,
  isLoggedIn,
  hasArtistProfile,
  membershipStatus,
}: {
  studioId: string;
  isLoggedIn: boolean;
  hasArtistProfile: boolean;
  membershipStatus: "owner" | "active" | "invited" | "requested" | null;
}) {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) return null;
  if (membershipStatus === "owner") return null;

  if (!hasArtistProfile) {
    return (
      <p className={styles.hint}>
        <Link href="/devenir-artiste">Deviens artiste</Link> pour pouvoir rejoindre ce studio.
      </p>
    );
  }

  if (membershipStatus === "active") {
    return <span className={styles.badge}>Tu es membre de ce studio</span>;
  }

  if (membershipStatus === "invited") {
    return (
      <p className={styles.hint}>
        Ce studio t&apos;a invité·e à le rejoindre — réponds depuis <Link href="/profil">ton profil</Link>.
      </p>
    );
  }

  if (membershipStatus === "requested" || sent) {
    return <span className={styles.badge}>Demande envoyée, en attente de réponse</span>;
  }

  return (
    <button
      type="button"
      className={styles.joinBtn}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await requestToJoinStudioAction(studioId);
          setSent(true);
        })
      }
    >
      {isPending ? "Envoi…" : "Rejoindre ce studio"}
    </button>
  );
}

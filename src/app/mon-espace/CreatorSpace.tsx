"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Artist, Film } from "@/data/types";
import type { PendingSubmission } from "@/db/queries";
import { describeReleaseRequest } from "@/lib/release-request";
import IdentitySection from "./IdentitySection";
import ProposeDialog, { presetKey, type ProposePreset } from "./ProposeDialog";
import styles from "./mon-espace.module.css";
import proposeStyles from "./propose.module.css";

export type ContentStatus = "online" | "soon" | "announcement";
export type Engagement = { views: number; comments: number };
export type IdentityData = {
  identity: Artist;
  films: Film[];
  engagement: Record<string, Engagement>;
  status: Record<string, ContentStatus>;
  banner: string | null;
};

// Films plus series (a series counts once, whatever its episode count).
function countContents(films: Film[]) {
  return new Set(films.map((f) => f.seriesTitle ?? f.id)).size;
}

function formatSentDate(createdAt: string) {
  const iso = createdAt.includes("T") ? createdAt : `${createdAt.replace(" ", "T")}Z`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

// Proposals of the active profile still waiting for the team.
function PendingList({ items }: { items: PendingSubmission[] }) {
  if (items.length === 0) return null;
  return (
    <section className={proposeStyles.pending}>
      <div className={proposeStyles.pendingHead}>
        <h3 className={proposeStyles.pendingTitle}>En attente de validation</h3>
        <span className={proposeStyles.pendingCount}>{items.length}</span>
      </div>
      <div className={proposeStyles.pendingList}>
        {items.map((s) => (
          <div key={s.id} className={proposeStyles.pendingItem}>
            <div className={proposeStyles.pendingThumb}>
              {s.poster && <Image src={s.poster} alt="" fill sizes="96px" unoptimized />}
            </div>
            <div className={proposeStyles.pendingText}>
              <span className={proposeStyles.pendingName}>
                {!s.seriesTitle
                  ? s.title
                  : s.releaseRequest.mode === "announcement"
                    ? `${s.seriesTitle} · annonce de la série`
                    : `${s.seriesTitle} · S${s.seasonNumber ?? 1}E${s.episodeNumber ?? 1} · ${s.title}`}
              </span>
              <span className={proposeStyles.pendingRelease}>
                {describeReleaseRequest(s.releaseRequest)} · envoyé le {formatSentDate(s.createdAt)}
              </span>
            </div>
            <span className={proposeStyles.pendingBadge}>En attente</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Switches between the creator's identities (personal artist profile and
// studios). The selection is mirrored in ?profil= so links can target one.
// Also holds the "Proposer un contenu" window (opened by ?proposer=1).
export default function CreatorSpace({
  data,
  identities,
  categories,
  initialIdentityId,
  pending,
  openProposal,
}: {
  data: IdentityData[];
  identities: Artist[];
  categories: string[];
  initialIdentityId: string;
  pending: PendingSubmission[];
  openProposal: boolean;
}) {
  const [activeId, setActiveId] = useState(
    data.some((d) => d.identity.id === initialIdentityId) ? initialIdentityId : data[0].identity.id
  );
  const [proposeOpen, setProposeOpen] = useState(openProposal);
  // What the window was opened for (an announcement's video, new episodes),
  // null for a free proposal.
  const [preset, setPreset] = useState<ProposePreset | null>(null);
  const openPropose = (next: ProposePreset | null = null) => {
    setPreset(next);
    setProposeOpen(true);
  };
  const active = data.find((d) => d.identity.id === activeId) ?? data[0];
  const activePending = pending.filter((s) => (s.studioId ?? s.artistId) === active.identity.id);
  const pendingAnnouncementIds = pending
    .map((s) => s.releaseRequest.replacesId)
    .filter((id): id is string => !!id);

  const select = (id: string) => {
    setActiveId(id);
    const url = new URL(window.location.href);
    if (id === data[0].identity.id) url.searchParams.delete("profil");
    else url.searchParams.set("profil", id);
    window.history.replaceState(null, "", url);
  };

  const closeProposal = () => {
    setProposeOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.has("proposer")) {
      url.searchParams.delete("proposer");
      window.history.replaceState(null, "", url);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Espace créateur</h1>
          <p className={styles.subtitle}>Gère tes contenus et tes profils, et suis comment ils sont reçus.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/soumettre-un-film" className={styles.ghostBtn}>
            Comment ça marche ?
          </Link>
          <button type="button" className={styles.primaryBtn} onClick={() => openPropose()}>
            + Proposer un contenu
          </button>
        </div>
      </div>

      {data.length > 1 && (
        <div className={styles.switcher} role="tablist" aria-label="Profils">
          {data.map(({ identity, films }) => (
            <button
              key={identity.id}
              type="button"
              role="tab"
              aria-selected={identity.id === activeId}
              className={`${styles.switch} ${identity.id === activeId ? styles.switchActive : ""}`}
              onClick={() => select(identity.id)}
            >
              <span className={styles.switchAvatar}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {identity.avatar ? <img src={identity.avatar} alt="" /> : identity.name.charAt(0)}
              </span>
              <span className={styles.switchText}>
                <span className={styles.switchName}>{identity.name}</span>
                <span className={styles.switchMeta}>
                  {`${identity.isStudio ? "Studio" : "Artiste"} · ${countContents(films)} contenu${countContents(films) > 1 ? "s" : ""}`}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <IdentitySection
        key={active.identity.id}
        data={active}
        identities={identities}
        categories={categories}
        onPropose={(next) => openPropose(next ?? null)}
        pendingSlot={<PendingList items={activePending} />}
        pendingAnnouncementIds={pendingAnnouncementIds}
      />

      <ProposeDialog
        // Reset per profile, so the "Publié par" default follows the active one.
        key={`propose-${active.identity.id}-${presetKey(preset)}`}
        open={proposeOpen}
        onClose={closeProposal}
        identities={identities}
        defaultIdentityId={active.identity.id}
        categories={categories}
        preset={preset}
      />
    </>
  );
}

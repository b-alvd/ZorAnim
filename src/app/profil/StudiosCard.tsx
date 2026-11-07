"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import Modal from "@/components/Modal/Modal";
import Dropdown from "@/components/Dropdown/Dropdown";
import type { Artist } from "@/data/types";
import type { StudioMember, StudioMemberInfo, StudioMembership } from "@/db/queries";
import {
  deleteStudioAction,
  inviteToStudioAction,
  removeStudioMembershipAction,
  respondToJoinRequestAction,
  respondToStudioInviteAction,
  type StudioActionResult,
} from "./studioActions";
import styles from "./StudiosCard.module.css";

type OwnedStudio = Artist & { members: StudioMemberInfo[] };
type PendingInvite = StudioMember & { studioName: string };
type JoinRequest = StudioMember & { studioName: string; requesterName: string };

// Runs a studio action and keeps its error message for display.
function useStudioAction() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const run = (action: () => Promise<StudioActionResult>, onSuccess?: () => void) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else onSuccess?.();
    });
  };
  return { error, isPending, run };
}

function Avatar({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

const CheckIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const CrossIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

function ConfirmDialog({
  open,
  onClose,
  title,
  text,
  confirmLabel,
  action,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  text: React.ReactNode;
  confirmLabel: string;
  action: () => Promise<StudioActionResult>;
}) {
  const { error, isPending, run } = useStudioAction();
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className={styles.dialog}>
        <p className={styles.dialogText}>{text}</p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostBtn} onClick={onClose}>
            Annuler
          </button>
          <button type="button" className={styles.dangerBtn} disabled={isPending} onClick={() => run(action, onClose)}>
            {isPending ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InviteDialog({
  open,
  onClose,
  studio,
  invitable,
}: {
  open: boolean;
  onClose: () => void;
  studio: OwnedStudio;
  invitable: Artist[];
}) {
  const [artistId, setArtistId] = useState(invitable[0]?.id ?? "");
  const { error, isPending, run } = useStudioAction();
  const selectedName = invitable.find((a) => a.id === artistId)?.name ?? invitable[0]?.name ?? "";

  return (
    <Modal open={open} onClose={onClose} title={`Inviter dans « ${studio.name} »`}>
      <div className={styles.dialog}>
        {invitable.length === 0 ? (
          <p className={styles.dialogText}>Aucun autre artiste disponible à inviter pour l&apos;instant.</p>
        ) : (
          <>
            <p className={styles.dialogText}>
              L&apos;artiste recevra une invitation qu&apos;il pourra accepter depuis son profil.
            </p>
            <Dropdown
              options={invitable.map((a) => a.name)}
              value={selectedName}
              onChange={(name) => {
                const found = invitable.find((a) => a.name === name);
                if (found) setArtistId(found.id);
              }}
            />
          </>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostBtn} onClick={onClose}>
            Annuler
          </button>
          {invitable.length > 0 && (
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={isPending || !artistId}
              onClick={() => run(() => inviteToStudioAction(studio.id, artistId), onClose)}
            >
              {isPending ? "Envoi…" : "Envoyer l'invitation"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function StudioHead({ studio, role }: { studio: Artist; role: "owner" | "member" }) {
  return (
    <div className={styles.head}>
      <Avatar src={studio.avatar} name={studio.name} size={44} />
      <div className={styles.headText}>
        <Link href={`/studios/${studio.id}`} className={styles.studioName}>
          {studio.name}
        </Link>
        <span className={`${styles.role} ${role === "owner" ? styles.roleOwner : ""}`}>
          {role === "owner" ? "Fondateur" : "Membre"}
        </span>
      </div>
      <Link href={`/studios/${studio.id}`} className={styles.iconLink} aria-label="Voir la page du studio">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
        </svg>
      </Link>
    </div>
  );
}

function OwnedStudioCard({
  studio,
  invitable,
  joinRequests,
}: {
  studio: OwnedStudio;
  invitable: Artist[];
  joinRequests: JoinRequest[];
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removing, setRemoving] = useState<StudioMemberInfo | null>(null);
  const { error, isPending, run } = useStudioAction();

  // "requested" rows are listed in the requests block, not as members.
  const members = studio.members.filter((m) => m.status !== "requested");
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <article className={styles.card}>
      <StudioHead studio={studio} role="owner" />

      {joinRequests.length > 0 && (
        <div className={styles.requests}>
          <span className={styles.blockLabel}>
            Demandes pour rejoindre <span className={styles.count}>{joinRequests.length}</span>
          </span>
          {joinRequests.map((req) => (
            <div key={req.id} className={styles.person}>
              <Avatar name={req.requesterName} />
              <span className={styles.personName}>{req.requesterName}</span>
              <button
                type="button"
                className={`${styles.roundBtn} ${styles.roundAccept}`}
                disabled={isPending}
                onClick={() => run(() => respondToJoinRequestAction(req.id, true))}
                aria-label={`Accepter ${req.requesterName}`}
                title="Accepter"
              >
                {CheckIcon}
              </button>
              <button
                type="button"
                className={styles.roundBtn}
                disabled={isPending}
                onClick={() => run(() => respondToJoinRequestAction(req.id, false))}
                aria-label={`Refuser ${req.requesterName}`}
                title="Refuser"
              >
                {CrossIcon}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.block}>
        <span className={styles.blockLabel}>
          Membres <span className={styles.count}>{activeCount}</span>
        </span>
        {members.length === 0 ? (
          <p className={styles.muted}>Aucun membre pour l&apos;instant. Invite des artistes à te rejoindre.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className={styles.person}>
              <Avatar src={m.avatar} name={m.name} />
              <span className={styles.personName}>{m.name}</span>
              {m.status === "invited" && <span className={styles.pending}>Invitation envoyée</span>}
              <button
                type="button"
                className={styles.roundBtn}
                disabled={isPending}
                onClick={() => setRemoving(m)}
                aria-label={m.status === "invited" ? `Annuler l'invitation de ${m.name}` : `Retirer ${m.name}`}
                title={m.status === "invited" ? "Annuler l'invitation" : "Retirer du studio"}
              >
                {CrossIcon}
              </button>
            </div>
          ))
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.footer}>
        <button type="button" className={styles.primaryBtn} onClick={() => setInviteOpen(true)}>
          + Inviter un artiste
        </button>
        <button type="button" className={styles.textDanger} onClick={() => setDeleteOpen(true)}>
          Supprimer le studio
        </button>
      </div>

      {inviteOpen && (
        <InviteDialog open onClose={() => setInviteOpen(false)} studio={studio} invitable={invitable} />
      )}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Supprimer le studio"
        text={
          <>
            Supprimer « {studio.name} » ? Cette action est irréversible. Impossible si le studio a des films ou séries
            au catalogue.
          </>
        }
        confirmLabel="Supprimer"
        action={() => deleteStudioAction(studio.id)}
      />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={removing?.status === "invited" ? "Annuler l'invitation" : "Retirer le membre"}
        text={
          removing?.status === "invited"
            ? `Annuler l'invitation envoyée à ${removing?.name} ?`
            : `Retirer ${removing?.name} de « ${studio.name} » ?`
        }
        confirmLabel={removing?.status === "invited" ? "Annuler l'invitation" : "Retirer"}
        action={() => removeStudioMembershipAction(removing!.id, studio.id)}
      />
    </article>
  );
}

function MemberStudioCard({ membership }: { membership: StudioMembership }) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { studio, membershipId } = membership;

  return (
    <article className={styles.card}>
      <StudioHead studio={studio} role="member" />
      {studio.bio && <p className={styles.bio}>{studio.bio}</p>}
      <div className={styles.footer}>
        <Link href={`/studios/${studio.id}`} className={styles.ghostBtn}>
          Voir le studio
        </Link>
        <button type="button" className={styles.textDanger} onClick={() => setLeaveOpen(true)}>
          Quitter le studio
        </button>
      </div>
      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Quitter le studio"
        text={`Quitter « ${studio.name} » ? Tu devras être réinvité pour le rejoindre à nouveau.`}
        confirmLabel="Quitter"
        action={() => removeStudioMembershipAction(membershipId, studio.id)}
      />
    </article>
  );
}

function InviteBanner({ invite }: { invite: PendingInvite }) {
  const { error, isPending, run } = useStudioAction();
  return (
    <div className={styles.invite}>
      <Avatar name={invite.studioName} size={38} />
      <div className={styles.inviteText}>
        <strong>« {invite.studioName} »</strong> t&apos;invite à rejoindre son studio.
        {error && <span className={styles.error}>{error}</span>}
      </div>
      <div className={styles.inviteActions}>
        <button
          type="button"
          className={styles.ghostBtn}
          disabled={isPending}
          onClick={() => run(() => respondToStudioInviteAction(invite.id, false))}
        >
          Refuser
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={isPending}
          onClick={() => run(() => respondToStudioInviteAction(invite.id, true))}
        >
          Accepter
        </button>
      </div>
    </div>
  );
}

export default function StudiosCard({
  ownedStudios,
  memberStudios,
  pendingInvites,
  joinRequests,
  invitableArtists,
}: {
  ownedStudios: OwnedStudio[];
  memberStudios: StudioMembership[];
  pendingInvites: PendingInvite[];
  joinRequests: JoinRequest[];
  invitableArtists: Artist[];
}) {
  const empty = ownedStudios.length === 0 && memberStudios.length === 0;

  return (
    <div className={styles.wrap}>
      {pendingInvites.map((invite) => (
        <InviteBanner key={invite.id} invite={invite} />
      ))}

      {empty ? (
        <div className={styles.empty}>
          <p>Tu ne fais partie d&apos;aucun studio. Crée le tien ou attends qu&apos;un studio t&apos;invite.</p>
          <Link href="/creer-un-studio" className={styles.primaryBtn}>
            Créer un studio
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {ownedStudios.map((studio) => (
            <OwnedStudioCard
              key={studio.id}
              studio={studio}
              invitable={invitableArtists.filter((a) => !studio.members.some((m) => m.name === a.name))}
              joinRequests={joinRequests.filter((r) => r.studioId === studio.id)}
            />
          ))}
          {memberStudios.map((m) => (
            <MemberStudioCard key={m.membershipId} membership={m} />
          ))}
        </div>
      )}
    </div>
  );
}

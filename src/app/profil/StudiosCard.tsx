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
  respondToStudioInviteAction,
} from "./studioActions";
import styles from "./StudiosCard.module.css";

type OwnedStudio = Artist & { members: StudioMemberInfo[] };
type PendingInvite = StudioMember & { studioName: string };

function InviteForm({ studioId, invitable, onDone }: { studioId: string; invitable: Artist[]; onDone: () => void }) {
  const [artistId, setArtistId] = useState(invitable[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  if (invitable.length === 0) {
    return <p className={styles.empty}>Aucun autre artiste disponible à inviter pour l&apos;instant.</p>;
  }

  const names = invitable.map((a) => a.name);
  const selectedName = invitable.find((a) => a.id === artistId)?.name ?? names[0];

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label>Artiste à inviter</label>
        <Dropdown
          options={names}
          value={selectedName}
          onChange={(name) => {
            const found = invitable.find((a) => a.name === name);
            if (found) setArtistId(found.id);
          }}
        />
      </div>
      <button
        type="button"
        className={styles.submitBtn}
        disabled={isPending || !artistId}
        onClick={() =>
          startTransition(async () => {
            await inviteToStudioAction(studioId, artistId);
            onDone();
          })
        }
      >
        {isPending ? "Envoi…" : "Inviter"}
      </button>
    </div>
  );
}

function DeleteStudioConfirm({
  studioName,
  studioId,
  onDone,
  onError,
}: {
  studioName: string;
  studioId: string;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.form}>
      <p className={styles.empty}>
        Supprimer <strong>{studioName}</strong> ? Cette action est irréversible. Impossible si le studio a des
        films au catalogue.
      </p>
      <button
        type="button"
        className={styles.refuseBtn}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteStudioAction(studioId);
              onDone();
            } catch (err) {
              onError(err instanceof Error ? err.message : "Échec de la suppression.");
            }
          })
        }
      >
        {isPending ? "Suppression…" : "Confirmer la suppression"}
      </button>
    </div>
  );
}

function OwnedStudioItem({ studio, invitable }: { studio: OwnedStudio; invitable: Artist[] }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.item}>
      <div className={styles.itemHeader}>
        <span className={styles.itemTitle}>{studio.name}</span>
        <span className={styles.badge}>Studio (toi)</span>
      </div>
      {studio.members.length > 0 && (
        <div className={styles.members}>
          {studio.members.map((m) => (
            <span key={m.id} className={styles.member}>
              {m.name}
              {m.status === "invited" && <span className={styles.badge}>En attente</span>}
              <button
                type="button"
                className={styles.removeBtn}
                disabled={isPending}
                onClick={() => startTransition(() => removeStudioMembershipAction(m.id))}
              >
                Retirer
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={styles.itemActions}>
        <button type="button" className={styles.linkBtn} onClick={() => setInviteOpen(true)}>
          Inviter un artiste
        </button>
        <button type="button" className={styles.refuseBtn} onClick={() => setDeleteOpen(true)}>
          Supprimer le studio
        </button>
      </div>
      {deleteError && <p className={styles.errorText}>{deleteError}</p>}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={`Inviter dans ${studio.name}`}>
        <InviteForm studioId={studio.id} invitable={invitable} onDone={() => setInviteOpen(false)} />
      </Modal>
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer le studio">
        <DeleteStudioConfirm
          studioName={studio.name}
          studioId={studio.id}
          onDone={() => setDeleteOpen(false)}
          onError={setDeleteError}
        />
      </Modal>
    </div>
  );
}

export default function StudiosCard({
  personalArtist,
  ownedStudios,
  memberStudios,
  pendingInvites,
  invitableArtists,
}: {
  personalArtist: Artist | null;
  ownedStudios: OwnedStudio[];
  memberStudios: StudioMembership[];
  pendingInvites: PendingInvite[];
  invitableArtists: Artist[];
}) {
  const [isPending, startTransition] = useTransition();

  if (!personalArtist) {
    return (
      <p className={styles.empty}>
        Tu dois être artiste pour créer ou rejoindre un studio.{" "}
        <Link href="/devenir-artiste">Devenir artiste</Link>
      </p>
    );
  }

  return (
    <div>
      {pendingInvites.length > 0 && (
        <>
          <p className={styles.sectionTitle}>Invitations reçues</p>
          <div className={styles.list}>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>{invite.studioName}</span>
                </div>
                <div className={styles.inviteActions}>
                  <button
                    type="button"
                    className={styles.acceptBtn}
                    disabled={isPending}
                    onClick={() => startTransition(() => respondToStudioInviteAction(invite.id, true))}
                  >
                    Accepter
                  </button>
                  <button
                    type="button"
                    className={styles.refuseBtn}
                    disabled={isPending}
                    onClick={() => startTransition(() => respondToStudioInviteAction(invite.id, false))}
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className={styles.sectionTitle}>Mes studios</p>

      {ownedStudios.length === 0 && memberStudios.length === 0 ? (
        <p className={styles.empty}>Tu ne fais partie d&apos;aucun studio.</p>
      ) : (
        <div className={styles.list}>
          {ownedStudios.map((studio) => (
            <OwnedStudioItem
              key={studio.id}
              studio={studio}
              invitable={invitableArtists.filter((a) => !studio.members.some((m) => m.name === a.name))}
            />
          ))}
          {memberStudios.map(({ membershipId, studio }) => (
            <div key={membershipId} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{studio.name}</span>
                <span className={`${styles.badge} ${styles.badgeActive}`}>Membre</span>
              </div>
              <button
                type="button"
                className={styles.linkBtn}
                disabled={isPending}
                onClick={() => startTransition(() => removeStudioMembershipAction(membershipId))}
              >
                Quitter le studio
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

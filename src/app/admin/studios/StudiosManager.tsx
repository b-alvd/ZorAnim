"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Dropdown from "@/components/Dropdown/Dropdown";
import Modal from "@/components/Modal/Modal";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import ConfirmActionButton from "../ConfirmActionButton";
import ContentList, { ContentCounts, Rating, plural } from "../ContentList";
import { contentStats, type ContentSummary } from "../content-summary";
import type { AccountOption } from "../artistes/ArtistForm";
import StudioForm from "./StudioForm";
import {
  adminAcceptStudioMemberAction,
  adminDeleteStudioAction,
  adminRemoveStudioMemberAction,
  adminTransferStudioAction,
  adminUpdateStudioAction,
} from "./actions";
import type { AdminStudioMember, AdminStudioRow } from "@/db/queries";
import shared from "../shared.module.css";
import styles from "../films/films.module.css";
import artistStyles from "../artistes/artists.module.css";
import own from "./studios.module.css";

export type AdminStudioItem = AdminStudioRow & { contents: ContentSummary[] };

const PAGE_SIZE = 15;
const PENDING_OPTIONS = ["Toutes les demandes", "Avec demandes en attente", "Sans demande"];
const CONTENT_OPTIONS = ["Avec ou sans contenu", "Avec contenu", "Sans contenu"];
const SORT_OPTIONS = ["Nom (A → Z)", "Plus de membres", "Plus de contenus", "Plus vus", "Mieux notés", "Plus récents"];

const STATUS_LABEL: Record<AdminStudioMember["status"], string> = {
  active: "Membre",
  invited: "Invité",
  requested: "Demande d'adhésion",
};

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

const activeMembers = (s: AdminStudioItem) => s.members.filter((m) => m.status === "active");
const pendingMembers = (s: AdminStudioItem) => s.members.filter((m) => m.status !== "active");

function EditStudioButton({ studio, accounts }: { studio: AdminStudioItem; accounts: AccountOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        className={shared.iconBtn}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        title="Modifier"
        aria-label="Modifier"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Modifier le studio ${studio.name}`}>
        <StudioForm
          initial={studio}
          accounts={accounts}
          pending={isPending}
          error={error}
          onSubmit={(formData) =>
            startTransition(async () => {
              const result = await adminUpdateStudioAction(studio.id, formData);
              if (result.error) setError(result.error);
              else setOpen(false);
            })
          }
        />
      </Modal>
    </>
  );
}

function MemberRow({
  member,
  studio,
}: {
  member: AdminStudioMember;
  studio: Pick<AdminStudioItem, "id" | "name" | "ownerName">;
}) {
  const studioId = studio.id;
  const [isPending, startTransition] = useTransition();
  const pendingRequest = member.status === "requested";
  const invited = member.status === "invited";

  return (
    <li className={own.member}>
      <span className={own.memberName}>{member.name}</span>
      <span className={own.memberEmail}>{member.email}</span>
      <span
        className={`${own.status} ${member.status === "active" ? own.statusActive : pendingRequest ? own.statusRequest : ""}`}
      >
        {STATUS_LABEL[member.status]}
      </span>
      <span className={own.memberDate}>depuis le {formatDate(member.createdAt)}</span>
      <span className={own.memberActions}>
        {member.status === "active" && (
          <ConfirmActionButton
            label="Nommer fondateur"
            icon={
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
              </svg>
            }
            buttonClassName={`${own.memberBtn} ${own.memberBtnFounder}`}
            disabled={isPending}
            confirmTitle={`Nouveau fondateur pour ${studio.name}`}
            confirmText={`${member.name} deviendra fondateur du studio ${studio.name}${studio.ownerName ? `, et ${studio.ownerName} restera dans l'équipe comme membre` : ""}. Les deux seront prévenus.`}
            confirmLabel="Nommer fondateur"
            action={() => adminTransferStudioAction(studioId, member.userId)}
          />
        )}
        {(pendingRequest || invited) && (
          <button
            type="button"
            className={`${own.memberBtn} ${own.memberBtnAccept}`}
            disabled={isPending}
            onClick={() => startTransition(() => adminAcceptStudioMemberAction(member.id, studioId))}
            title={invited ? "Valider l'invitation sans attendre la réponse" : "Accepter la demande"}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {pendingRequest ? "Accepter" : "Valider"}
          </button>
        )}
        <button
          type="button"
          className={`${own.memberBtn} ${own.memberBtnRemove}`}
          disabled={isPending}
          onClick={() => startTransition(() => adminRemoveStudioMemberAction(member.id, studioId))}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          {pendingRequest ? "Refuser" : invited ? "Annuler l'invitation" : "Retirer"}
        </button>
      </span>
    </li>
  );
}

function StudioLines({ studio, accounts }: { studio: AdminStudioItem; accounts: AccountOption[] }) {
  const [expanded, setExpanded] = useState(false);
  const s = contentStats(studio.contents);
  const members = activeMembers(studio);
  const pending = pendingMembers(studio);
  const requests = pending.filter((m) => m.status === "requested").length;
  const invites = pending.length - requests;

  return (
    <>
      <tr className={`${styles.row} ${styles.seriesRow}`} onClick={() => setExpanded((v) => !v)}>
        <td>
          <div className={styles.content}>
            <svg
              className={styles.chevron}
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ transform: expanded ? "rotate(90deg)" : "none" }}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span className={`${artistStyles.avatar} ${own.logo}`}>
              {studio.avatar ? (
                <Image src={studio.avatar} alt="" fill sizes="44px" unoptimized />
              ) : (
                studio.name.charAt(0).toUpperCase()
              )}
            </span>
            <div className={styles.contentText}>
              <span className={styles.contentTitle}>{studio.name}</span>
              <span className={styles.contentMeta}>Créé le {formatDate(studio.createdAt)}</span>
            </div>
          </div>
        </td>
        <td>
          {studio.ownerId ? (
            <span className={own.owner} title={studio.ownerEmail ?? ""}>
              ★ {studio.ownerName}
            </span>
          ) : (
            <span
              className={`${styles.kindTag} ${artistStyles.noAccount}`}
              title="Chaque studio doit avoir un fondateur : modifie-le pour en choisir un."
            >
              À relier à un fondateur
            </span>
          )}
        </td>
        <td>
          <span className={own.membersCell}>
            <span>{plural(members.length, "membre")}</span>
            {(requests > 0 || invites > 0) && (
              <span className={own.pendingNote}>
                {[requests && plural(requests, "demande"), invites && plural(invites, "invitation")]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                en attente
              </span>
            )}
          </span>
        </td>
        <td>
          <ContentCounts contents={studio.contents} />
        </td>
        <td className={styles.num}>{s.views}</td>
        <td className={styles.num}>
          <Rating value={s.rating} count={s.voters} />
        </td>
        <td>
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <a
              href={`/studios/${studio.id}`}
              target="_blank"
              rel="noreferrer"
              className={styles.iconBtn}
              title="Voir la page du studio"
              aria-label="Voir la page du studio"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path d="M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
            <EditStudioButton studio={studio} accounts={accounts} />
            <ConfirmDeleteButton
              compact
              action={adminDeleteStudioAction.bind(null, studio.id)}
              itemName={
                studio.contents.length > 0
                  ? `le studio ${studio.name}, avec ses ${studio.contents.length > 1 ? `${studio.contents.length} films et séries` : "1 film ou série"} (supprimés aussi) et ses membres`
                  : `le studio ${studio.name} et ses membres`
              }
            />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className={styles.episodeRow}>
          <td colSpan={7}>
            <div className={artistStyles.details}>
              <p className={artistStyles.bio}>{studio.bio}</p>
              <div>
                <h4 className={own.subTitle}>Équipe</h4>
                {studio.members.length === 0 ? (
                  <p className={styles.muted}>Aucun membre en dehors du fondateur.</p>
                ) : (
                  <ul className={own.memberList}>
                    {[...pending, ...members].map((m) => (
                      <MemberRow key={m.id} member={m} studio={studio} />
                    ))}
                  </ul>
                )}
              </div>
              {studio.contents.length > 0 && (
                <div>
                  <h4 className={own.subTitle}>Contenus</h4>
                  <ContentList contents={studio.contents} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function StudiosManager({ studios, accounts }: { studios: AdminStudioItem[]; accounts: AccountOption[] }) {
  const [query, setQuery] = useState("");
  const [pendingFilter, setPendingFilter] = useState(PENDING_OPTIONS[0]);
  const [content, setContent] = useState(CONTENT_OPTIONS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(0);

  const summary = useMemo(
    () => ({
      total: studios.length,
      members: studios.reduce((n, s) => n + activeMembers(s).length, 0),
      pending: studios.filter((s) => pendingMembers(s).length > 0).length,
      withoutOwner: studios.filter((s) => !s.ownerId).length,
      withoutContent: studios.filter((s) => s.contents.length === 0).length,
    }),
    [studios]
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const list = studios.filter((s) => {
      if (pendingFilter === "Avec demandes en attente" && pendingMembers(s).length === 0) return false;
      if (pendingFilter === "Sans demande" && pendingMembers(s).length > 0) return false;
      if (content === "Avec contenu" && s.contents.length === 0) return false;
      if (content === "Sans contenu" && s.contents.length > 0) return false;
      if (needle) {
        const haystack = [s.name, s.bio, s.ownerName ?? "", s.ownerEmail ?? "", ...s.members.map((m) => m.name)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    const byName = (x: AdminStudioItem, y: AdminStudioItem) => x.name.localeCompare(y.name, "fr");
    const comparators: Record<string, (x: AdminStudioItem, y: AdminStudioItem) => number> = {
      "Plus de membres": (x, y) => activeMembers(y).length - activeMembers(x).length || byName(x, y),
      "Plus de contenus": (x, y) => y.contents.length - x.contents.length || byName(x, y),
      "Plus vus": (x, y) => contentStats(y.contents).views - contentStats(x.contents).views || byName(x, y),
      "Mieux notés": (x, y) =>
        (contentStats(y.contents).rating ?? -1) - (contentStats(x.contents).rating ?? -1) || byName(x, y),
      "Plus récents": (x, y) => y.createdAt.localeCompare(x.createdAt) || byName(x, y),
    };
    return list.sort(comparators[sort] ?? byName);
  }, [studios, pendingFilter, content, needle, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageItems = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(0);
    };
  const applyFilters = (next: { pending?: string; content?: string }) => {
    setPendingFilter(next.pending ?? PENDING_OPTIONS[0]);
    setContent(next.content ?? CONTENT_OPTIONS[0]);
    setPage(0);
  };
  const hasFilters = needle !== "" || pendingFilter !== PENDING_OPTIONS[0] || content !== CONTENT_OPTIONS[0];

  const chips = [
    { label: "Studios", value: summary.total, onClick: () => applyFilters({}) },
    { label: "Membres au total", value: summary.members, onClick: () => applyFilters({}) },
    {
      label: "Avec demandes en attente",
      value: summary.pending,
      accent: summary.pending > 0,
      onClick: () => applyFilters({ pending: "Avec demandes en attente" }),
    },
    {
      label: "Sans contenu",
      value: summary.withoutContent,
      onClick: () => applyFilters({ content: "Sans contenu" }),
    },
    ...(summary.withoutOwner > 0
      ? [{ label: "À relier à un fondateur", value: summary.withoutOwner, accent: true, onClick: () => applyFilters({}) }]
      : []),
  ];

  return (
    <div className={styles.manager}>
      <div className={styles.summary}>
        {chips.map((c) => (
          <button
            key={c.label}
            type="button"
            className={`${styles.chip} ${"accent" in c && c.accent ? styles.chipAccent : ""}`}
            onClick={c.onClick}
          >
            <span className={styles.chipValue}>{c.value}</span>
            <span className={styles.chipLabel}>{c.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Studio, fondateur, membre…"
            value={query}
            onChange={(e) => withReset(setQuery)(e.target.value)}
          />
        </div>
        <div className={styles.filter}>
          <Dropdown options={PENDING_OPTIONS} value={pendingFilter} onChange={withReset(setPendingFilter)} />
        </div>
        <div className={styles.filter}>
          <Dropdown options={CONTENT_OPTIONS} value={content} onChange={withReset(setContent)} />
        </div>
        <div className={styles.filter}>
          <Dropdown options={SORT_OPTIONS} value={sort} onChange={withReset(setSort)} />
        </div>
      </div>

      <div className={styles.resultsBar}>
        <span>{plural(visible.length, "résultat")}</span>
        {hasFilters && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setQuery("");
              applyFilters({});
            }}
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className={shared.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.contentHead}>Studio</th>
              <th>Fondateur</th>
              <th>Équipe</th>
              <th>Contenus</th>
              <th className={styles.num}>Vues</th>
              <th className={styles.num}>Note</th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  {studios.length === 0 ? "Aucun studio pour l'instant." : "Aucun studio ne correspond à ces filtres."}
                </td>
              </tr>
            ) : (
              pageItems.map((s) => <StudioLines key={s.id} studio={s} accounts={accounts} />)
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className={styles.pager}>
          <button type="button" className={shared.editLink} disabled={current === 0} onClick={() => setPage(current - 1)}>
            Précédent
          </button>
          <span className={styles.pagerLabel}>
            Page {current + 1} sur {pageCount}
          </span>
          <button
            type="button"
            className={shared.editLink}
            disabled={current === pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

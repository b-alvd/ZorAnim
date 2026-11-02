"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Dropdown from "@/components/Dropdown/Dropdown";
import Modal from "@/components/Modal/Modal";
import BanUserButton from "./BanUserButton";
import ResetPasswordButton from "./ResetPasswordButton";
import { deleteUserAction, setRoleAction, unbanUserAction, type UserActionResult } from "./actions";
import { plural } from "../ContentList";
import type { AdminUser, AdminUserActivity } from "@/db/queries";
import shared from "../shared.module.css";
import styles from "../films/films.module.css";
import artistStyles from "../artistes/artists.module.css";
import own from "./users.module.css";

export type AdminUserItem = AdminUser & {
  isSelf: boolean;
  isProtected: boolean;
  artist: { id: string; name: string } | null;
  foundedStudios: { id: string; name: string }[];
  memberStudios: { id: string; name: string }[];
  activity: AdminUserActivity;
};

const PAGE_SIZE = 20;
const ROLE_OPTIONS = ["Tous les rôles", "Admins", "Utilisateurs"];
const STATUS_OPTIONS = ["Tous les statuts", "Actifs", "Bannis", "Demande de débannissement", "Mot de passe temporaire"];
const PROFILE_OPTIONS = ["Tous les profils", "Artistes", "Fondateurs de studio", "Sans profil d'artiste"];
const SORT_OPTIONS = ["Inscription récente", "Nom (A → Z)", "Dernière activité", "Dernière connexion", "Plus actifs"];

const DAY = 24 * 60 * 60 * 1000;

const parse = (at: string) => new Date(at.includes("T") ? at : `${at.replace(" ", "T")}Z`);

function formatDate(at: string | null) {
  if (!at) return "—";
  return parse(at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });
}

// Relative label against the server-provided "now".
function formatAgo(at: string | null, now: number) {
  if (!at) return "Jamais";
  const days = Math.floor((now - parse(at).getTime()) / DAY);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} jours`;
  return formatDate(at);
}

const score = (u: AdminUserItem) => u.activity.views + u.activity.ratings * 2 + u.activity.comments * 3 + u.activity.favorites;

function Avatar({ user }: { user: AdminUserItem }) {
  return (
    <span className={artistStyles.avatar}>
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt="" fill sizes="44px" unoptimized />
      ) : (
        user.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

// A confirm dialog whose action returns { error } instead of throwing.
function ConfirmButton({
  trigger,
  title,
  text,
  confirmLabel,
  danger,
  action,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  text: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  action: () => Promise<UserActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {trigger(() => {
        setError(null);
        setOpen(true);
      })}
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className={shared.confirmText}>{text}</p>
        {error && <p className={styles.formError}>{error}</p>}
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
                if (result.error) setError(result.error);
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

function Actions({ user }: { user: AdminUserItem }) {
  if (user.isSelf) return <span className={own.tag}>Toi</span>;
  if (user.isProtected) return <span className={own.tag}>Protégé</span>;

  const isAdmin = user.role === "admin";
  const deleteBlocker = user.artist
    ? `Ce compte porte le profil d'artiste ${user.artist.name} : relie le profil à un autre compte ou supprime l'artiste (onglet Artistes) d'abord.`
    : user.foundedStudios.length
      ? `Ce compte a fondé ${user.foundedStudios.map((s) => s.name).join(", ")} : transfère le studio (onglet Studios) d'abord.`
      : null;

  return (
    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
      <ConfirmButton
        title={isAdmin ? `Retirer les droits admin de ${user.name}` : `Passer ${user.name} admin`}
        text={
          isAdmin
            ? `${user.name} n'aura plus accès à l'administration.`
            : `${user.name} aura accès à toute l'administration : contenus, comptes, demandes, réglages du site.`
        }
        confirmLabel={isAdmin ? "Retirer les droits" : "Passer admin"}
        danger={!isAdmin}
        action={() => setRoleAction(user.id, isAdmin ? "user" : "admin")}
        trigger={(open) => (
          <button
            type="button"
            className={`${shared.iconBtn} ${isAdmin ? own.adminOn : ""}`}
            onClick={open}
            title={isAdmin ? "Retirer les droits admin" : "Passer admin"}
            aria-label={isAdmin ? "Retirer les droits admin" : "Passer admin"}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" />
            </svg>
          </button>
        )}
      />
      <ResetPasswordButton userId={user.id} userName={user.name} />
      {user.banned ? (
        <ConfirmButton
          title={`Débannir ${user.name}`}
          text={`${user.name} pourra de nouveau se connecter.`}
          confirmLabel="Débannir"
          action={() => unbanUserAction(user.id)}
          trigger={(open) => (
            <button type="button" className={`${shared.iconBtn} ${own.unban}`} onClick={open} title="Débannir" aria-label="Débannir">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 7.8-1.2" />
              </svg>
            </button>
          )}
        />
      ) : (
        <BanUserButton userId={user.id} userName={user.name} />
      )}
      {deleteBlocker ? (
        <span className={`${shared.iconBtn} ${own.locked}`} title={deleteBlocker} aria-label="Suppression bloquée">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
      ) : (
        <ConfirmButton
          title={`Supprimer le compte de ${user.name}`}
          text={
            <>
              Supprimer définitivement le compte de <strong>{user.name}</strong> ({user.email}) ? Ses notes, commentaires,
              favoris et son historique seront supprimés aussi. Action irréversible.
            </>
          }
          confirmLabel="Supprimer"
          danger
          action={() => deleteUserAction(user.id)}
          trigger={(open) => (
            <button type="button" className={shared.deleteIconBtn} onClick={open} title="Supprimer" aria-label="Supprimer">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          )}
        />
      )}
    </div>
  );
}

function UserLines({ user, now }: { user: AdminUserItem; now: number }) {
  const [expanded, setExpanded] = useState(false);
  const a = user.activity;

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
            <Avatar user={user} />
            <div className={styles.contentText}>
              <span className={styles.contentTitle}>{user.name}</span>
              <span className={own.email}>{user.email}</span>
            </div>
          </div>
        </td>
        <td>
          <span className={own.badges}>
            {user.role === "admin" && <span className={`${own.badge} ${own.badgeAdmin}`}>Admin</span>}
            {user.artist && <span className={`${own.badge} ${own.badgeArtist}`}>Artiste</span>}
            {user.foundedStudios.length > 0 && <span className={`${own.badge} ${own.badgeFounder}`}>★ Fondateur</span>}
            {user.banned && <span className={`${own.badge} ${own.badgeBanned}`}>Banni</span>}
            {a.pendingAppeal && <span className={`${own.badge} ${own.badgeWarn}`}>Demande de débannissement</span>}
            {user.mustChangePassword && <span className={`${own.badge} ${own.badgeWarn}`}>Mdp temporaire</span>}
            {user.role !== "admin" && !user.artist && !user.foundedStudios.length && !user.banned && (
              <span className={styles.muted}>Membre</span>
            )}
          </span>
        </td>
        <td className={own.date}>{formatDate(user.createdAt)}</td>
        <td className={own.date} title={a.lastActivityAt ? formatDate(a.lastActivityAt) : undefined}>
          {formatAgo(a.lastActivityAt, now)}
        </td>
        <td className={styles.num}>{a.views}</td>
        <td className={styles.num}>{a.ratings}</td>
        <td className={styles.num}>{a.comments}</td>
        <td>
          <Actions user={user} />
        </td>
      </tr>
      {expanded && (
        <tr className={styles.episodeRow}>
          <td colSpan={8}>
            <dl className={own.details}>
              <div>
                <dt>Dernière connexion</dt>
                <dd>
                  {formatAgo(a.lastLoginAt, now)}
                  {a.activeSessions > 0 && <span className={styles.muted}> · {plural(a.activeSessions, "session")} active{a.activeSessions > 1 ? "s" : ""}</span>}
                </dd>
              </div>
              <div>
                <dt>Activité</dt>
                <dd>
                  {plural(a.views, "contenu")} vu{a.views > 1 ? "s" : ""} · {plural(a.ratings, "note")} ·{" "}
                  {plural(a.comments, "commentaire")} · {plural(a.favorites, "favori")}
                </dd>
              </div>
              <div>
                <dt>Profil d&apos;artiste</dt>
                <dd>
                  {user.artist ? (
                    <a href={`/artistes/${user.artist.id}`} target="_blank" rel="noreferrer" className={own.link}>
                      {user.artist.name}
                    </a>
                  ) : (
                    <span className={styles.muted}>Aucun</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Studios</dt>
                <dd>
                  {user.foundedStudios.length === 0 && user.memberStudios.length === 0 ? (
                    <span className={styles.muted}>Aucun</span>
                  ) : (
                    <span className={artistStyles.studios}>
                      {user.foundedStudios.map((s) => (
                        <span key={s.id} className={artistStyles.studioChip}>
                          {s.name} <span className={artistStyles.owner}>★</span>
                        </span>
                      ))}
                      {user.memberStudios.map((s) => (
                        <span key={s.id} className={artistStyles.studioChip}>
                          {s.name}
                        </span>
                      ))}
                    </span>
                  )}
                </dd>
              </div>
              {user.banned && (
                <div className={own.wide}>
                  <dt>Bannissement</dt>
                  <dd>
                    {user.bannedAt ? `Depuis le ${formatDate(user.bannedAt)}` : "Banni"}
                    {user.banReason ? ` · Raison : ${user.banReason}` : " · Sans raison indiquée"}
                    {a.pendingAppeal && (
                      <>
                        {" · "}
                        <a href="/admin/demandes" className={own.link}>
                          Voir sa demande de débannissement
                        </a>
                      </>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

// `now` comes from the server so relative dates render the same on both sides.
export default function UsersManager({ users, now }: { users: AdminUserItem[]; now: number }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [profile, setProfile] = useState(PROFILE_OPTIONS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(0);

  const summary = useMemo(
    () => ({
      total: users.length,
      newUsers: users.filter((u) => now - parse(u.createdAt).getTime() < 30 * DAY).length,
      active: users.filter((u) => u.activity.lastActivityAt && now - parse(u.activity.lastActivityAt).getTime() < 30 * DAY)
        .length,
      admins: users.filter((u) => u.role === "admin").length,
      artists: users.filter((u) => u.artist).length,
      banned: users.filter((u) => u.banned).length,
      appeals: users.filter((u) => u.activity.pendingAppeal).length,
    }),
    [users, now]
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const list = users.filter((u) => {
      if (role === "Admins" && u.role !== "admin") return false;
      if (role === "Utilisateurs" && u.role === "admin") return false;
      if (status === "Actifs" && u.banned) return false;
      if (status === "Bannis" && !u.banned) return false;
      if (status === "Demande de débannissement" && !u.activity.pendingAppeal) return false;
      if (status === "Mot de passe temporaire" && !u.mustChangePassword) return false;
      if (profile === "Artistes" && !u.artist) return false;
      if (profile === "Fondateurs de studio" && u.foundedStudios.length === 0) return false;
      if (profile === "Sans profil d'artiste" && u.artist) return false;
      if (needle) {
        const haystack = [u.name, u.email, u.artist?.name ?? "", ...u.foundedStudios.map((s) => s.name)].join(" ").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    const byName = (x: AdminUserItem, y: AdminUserItem) => x.name.localeCompare(y.name, "fr");
    const byDate = (pick: (u: AdminUserItem) => string | null) => (x: AdminUserItem, y: AdminUserItem) =>
      (pick(y) ?? "").localeCompare(pick(x) ?? "") || byName(x, y);
    const comparators: Record<string, (x: AdminUserItem, y: AdminUserItem) => number> = {
      "Nom (A → Z)": byName,
      "Dernière activité": byDate((u) => u.activity.lastActivityAt),
      "Dernière connexion": byDate((u) => u.activity.lastLoginAt),
      "Plus actifs": (x, y) => score(y) - score(x) || byName(x, y),
    };
    return list.sort(comparators[sort] ?? ((x, y) => parse(y.createdAt).getTime() - parse(x.createdAt).getTime()));
  }, [users, role, status, profile, needle, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageItems = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(0);
    };
  const applyFilters = (next: { role?: string; status?: string; profile?: string; sort?: string }) => {
    setRole(next.role ?? ROLE_OPTIONS[0]);
    setStatus(next.status ?? STATUS_OPTIONS[0]);
    setProfile(next.profile ?? PROFILE_OPTIONS[0]);
    if (next.sort) setSort(next.sort);
    setPage(0);
  };
  const hasFilters =
    needle !== "" || role !== ROLE_OPTIONS[0] || status !== STATUS_OPTIONS[0] || profile !== PROFILE_OPTIONS[0];

  const chips = [
    { label: "Utilisateurs", value: summary.total, onClick: () => applyFilters({}) },
    { label: "Inscrits (30 j)", value: summary.newUsers, onClick: () => applyFilters({ sort: "Inscription récente" }) },
    { label: "Actifs (30 j)", value: summary.active, onClick: () => applyFilters({ sort: "Dernière activité" }) },
    { label: "Admins", value: summary.admins, onClick: () => applyFilters({ role: "Admins" }) },
    { label: "Artistes", value: summary.artists, onClick: () => applyFilters({ profile: "Artistes" }) },
    { label: "Bannis", value: summary.banned, onClick: () => applyFilters({ status: "Bannis" }) },
    {
      label: "Demandes de débannissement",
      value: summary.appeals,
      accent: summary.appeals > 0,
      onClick: () => applyFilters({ status: "Demande de débannissement" }),
    },
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
            placeholder="Nom, email, artiste, studio…"
            value={query}
            onChange={(e) => withReset(setQuery)(e.target.value)}
          />
        </div>
        <div className={styles.filter}>
          <Dropdown options={ROLE_OPTIONS} value={role} onChange={withReset(setRole)} />
        </div>
        <div className={styles.filter}>
          <Dropdown options={STATUS_OPTIONS} value={status} onChange={withReset(setStatus)} />
        </div>
        <div className={styles.filter}>
          <Dropdown options={PROFILE_OPTIONS} value={profile} onChange={withReset(setProfile)} />
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
              <th className={styles.contentHead}>Utilisateur</th>
              <th>Statut</th>
              <th>Inscrit le</th>
              <th>Dernière activité</th>
              <th className={styles.num} title="Contenus regardés">
                Vus
              </th>
              <th className={styles.num}>Notes</th>
              <th className={styles.num} title="Commentaires">
                Comm.
              </th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Aucun utilisateur ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              pageItems.map((u) => <UserLines key={u.id} user={u} now={now} />)
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

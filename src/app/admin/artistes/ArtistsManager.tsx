"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import ContentList, { ContentCounts, Rating, plural } from "../ContentList";
import { contentStats, type ContentSummary } from "../content-summary";
import Dropdown from "@/components/Dropdown/Dropdown";
import Modal from "@/components/Modal/Modal";
import ConfirmDeleteButton from "../ConfirmDeleteButton";
import ArtistForm, { type AccountOption } from "./ArtistForm";
import { deleteArtistAction, updateArtistAction } from "./actions";
import type { AdminArtistRow } from "@/db/queries";
import shared from "../shared.module.css";
import styles from "../films/films.module.css";
import own from "./artists.module.css";

export type AdminArtist = AdminArtistRow & { contents: ContentSummary[] };

export type AccountChoice = AccountOption & { artistName: string | null };

const PAGE_SIZE = 15;
const ACCOUNT_OPTIONS = ["Tous les comptes", "Avec compte", "À relier à un compte"];
const CONTENT_OPTIONS = ["Avec ou sans contenu", "Avec contenu", "Sans contenu"];
const STUDIO_OPTIONS = ["Studios : tous", "En studio", "Indépendant"];
const SORT_OPTIONS = ["Nom (A → Z)", "Plus de contenus", "Plus vus", "Mieux notés", "Dernier ajout"];

function stats(a: AdminArtist) {
  return { ...contentStats(a.contents), personal: a.contents.filter((c) => !c.via).length };
}

function Avatar({ src, name }: { src: string; name: string }) {
  return (
    <span className={own.avatar}>
      {src ? <Image src={src} alt="" fill sizes="44px" unoptimized /> : name.charAt(0).toUpperCase()}
    </span>
  );
}

function EditArtistButton({ artist, accounts }: { artist: AdminArtist; accounts: AccountChoice[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Free accounts, plus the one currently linked to this artist.
  const options = accounts.filter((a) => !a.artistName || a.id === artist.userId);

  return (
    <>
      <button
        type="button"
        className={shared.iconBtn}
        onClick={(e) => {
          e.stopPropagation();
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
      <Modal open={open} onClose={() => setOpen(false)} title={`Modifier ${artist.name}`}>
        <ArtistForm
          initial={artist}
          accounts={options}
          pending={isPending}
          error={error}
          onSubmit={(formData) =>
            startTransition(async () => {
              const result = await updateArtistAction(artist.id, formData);
              if (result.error) setError(result.error);
              else setOpen(false);
            })
          }
        />
      </Modal>
    </>
  );
}

function ArtistLines({ artist, accounts }: { artist: AdminArtist; accounts: AccountChoice[] }) {
  const [expanded, setExpanded] = useState(false);
  const s = stats(artist);
  const personalCount = s.personal;

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
            <Avatar src={artist.avatar} name={artist.name} />
            <div className={styles.contentText}>
              <span className={styles.contentTitle}>{artist.name}</span>
              <span className={styles.contentMeta}>
                {artist.userId ? (
                  <span title={artist.userEmail ?? ""}>Compte : {artist.userName}</span>
                ) : (
                  <span
                    className={`${styles.kindTag} ${own.noAccount}`}
                    title="Chaque profil d'artiste doit appartenir à un compte : modifie-le pour en choisir un."
                  >
                    À relier à un compte
                  </span>
                )}
              </span>
            </div>
          </div>
        </td>
        <td>
          {artist.studios.length === 0 ? (
            <span className={styles.muted}>Indépendant</span>
          ) : (
            <span className={own.studios}>
              {artist.studios.map((st) => (
                <span key={st.id} className={own.studioChip} title={st.isOwner ? "Fondateur" : "Membre"}>
                  {st.name}
                  {st.isOwner && <span className={own.owner}>★</span>}
                </span>
              ))}
            </span>
          )}
        </td>
        <td>
          {artist.contents.length === 0 ? (
            <span className={styles.muted}>Aucun contenu</span>
          ) : (
            <span className={own.counts}>
              <ContentCounts contents={artist.contents} />
              {personalCount !== artist.contents.length && (
                <span className={styles.muted}>
                  {personalCount} perso · {artist.contents.length - personalCount} via studio
                </span>
              )}
            </span>
          )}
        </td>
        <td className={styles.num}>{s.views}</td>
        <td className={styles.num}>
          <Rating value={s.rating} count={s.voters} />
        </td>
        <td className={styles.num}>{s.comments}</td>
        <td>
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <a
              href={`/artistes/${artist.id}`}
              target="_blank"
              rel="noreferrer"
              className={styles.iconBtn}
              title="Voir le profil public"
              aria-label="Voir le profil public"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path d="M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
            <EditArtistButton artist={artist} accounts={accounts} />
            <ConfirmDeleteButton
              compact
              action={deleteArtistAction.bind(null, artist.id)}
              itemName={
                personalCount > 0
                  ? `l'artiste ${artist.name}, avec ses ${personalCount > 1 ? `${personalCount} films et séries` : "1 film ou série"} perso (supprimés aussi)`
                  : `l'artiste ${artist.name}`
              }
            />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className={styles.episodeRow}>
          <td colSpan={7}>
            <div className={own.details}>
              <p className={own.bio}>{artist.bio}</p>
              <ContentList contents={artist.contents} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ArtistsManager({ artists, accounts }: { artists: AdminArtist[]; accounts: AccountChoice[] }) {
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState(ACCOUNT_OPTIONS[0]);
  const [content, setContent] = useState(CONTENT_OPTIONS[0]);
  const [studio, setStudio] = useState(STUDIO_OPTIONS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(0);

  const summary = useMemo(
    () => ({
      total: artists.length,
      withAccount: artists.filter((a) => a.userId).length,
      withoutAccount: artists.filter((a) => !a.userId).length,
      inStudio: artists.filter((a) => a.studios.length > 0).length,
      withoutContent: artists.filter((a) => a.contents.length === 0).length,
    }),
    [artists]
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const list = artists.filter((a) => {
      if (account === "Avec compte" && !a.userId) return false;
      if (account === "À relier à un compte" && a.userId) return false;
      if (content === "Avec contenu" && a.contents.length === 0) return false;
      if (content === "Sans contenu" && a.contents.length > 0) return false;
      if (studio === "En studio" && a.studios.length === 0) return false;
      if (studio === "Indépendant" && a.studios.length > 0) return false;
      if (needle) {
        const haystack = [a.name, a.bio, a.userName ?? "", a.userEmail ?? "", ...a.studios.map((s) => s.name)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    const byName = (x: AdminArtist, y: AdminArtist) => x.name.localeCompare(y.name, "fr");
    const comparators: Record<string, (x: AdminArtist, y: AdminArtist) => number> = {
      "Plus de contenus": (x, y) => y.contents.length - x.contents.length || byName(x, y),
      "Plus vus": (x, y) => stats(y).views - stats(x).views || byName(x, y),
      "Mieux notés": (x, y) => (stats(y).rating ?? -1) - (stats(x).rating ?? -1) || byName(x, y),
      "Dernier ajout": (x, y) => stats(y).latestAt.localeCompare(stats(x).latestAt) || byName(x, y),
    };
    return list.sort(comparators[sort] ?? byName);
  }, [artists, account, content, studio, needle, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageItems = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(0);
    };
  const applyChip = (next: { account?: string; content?: string; studio?: string }) => {
    setAccount(next.account ?? ACCOUNT_OPTIONS[0]);
    setContent(next.content ?? CONTENT_OPTIONS[0]);
    setStudio(next.studio ?? STUDIO_OPTIONS[0]);
    setPage(0);
  };
  const hasFilters =
    needle !== "" || account !== ACCOUNT_OPTIONS[0] || content !== CONTENT_OPTIONS[0] || studio !== STUDIO_OPTIONS[0];

  const chips = [
    { label: "Artistes", value: summary.total, onClick: () => applyChip({}) },
    { label: "Avec compte", value: summary.withAccount, onClick: () => applyChip({ account: "Avec compte" }) },
    {
      label: "À relier à un compte",
      value: summary.withoutAccount,
      onClick: () => applyChip({ account: "À relier à un compte" }),
    },
    { label: "En studio", value: summary.inStudio, onClick: () => applyChip({ studio: "En studio" }) },
    {
      label: "Sans contenu",
      value: summary.withoutContent,
      onClick: () => applyChip({ content: "Sans contenu" }),
    },
  ];

  return (
    <div className={styles.manager}>
      <div className={styles.summary}>
        {chips.map((c) => (
          <button key={c.label} type="button" className={styles.chip} onClick={c.onClick}>
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
            placeholder="Nom, compte, studio…"
            value={query}
            onChange={(e) => withReset(setQuery)(e.target.value)}
          />
        </div>
        <div className={styles.filter}>
          <Dropdown options={ACCOUNT_OPTIONS} value={account} onChange={withReset(setAccount)} />
        </div>
        <div className={styles.filter}>
          <Dropdown options={STUDIO_OPTIONS} value={studio} onChange={withReset(setStudio)} />
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
              applyChip({});
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
              <th className={styles.contentHead}>Artiste</th>
              <th>Studios</th>
              <th>Contenus</th>
              <th className={styles.num}>Vues</th>
              <th className={styles.num}>Note</th>
              <th className={styles.num} title="Commentaires">
                Comm.
              </th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Aucun artiste ne correspond à ces filtres.
                </td>
              </tr>
            ) : (
              pageItems.map((a) => <ArtistLines key={a.id} artist={a} accounts={accounts} />)
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

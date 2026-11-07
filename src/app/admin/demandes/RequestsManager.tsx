"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Dropdown from "@/components/Dropdown/Dropdown";
import AdminPager from "../AdminPager";
import Modal from "@/components/Modal/Modal";
import FilmSubmissionForm from "./FilmSubmissionForm";
import ArtistSubmissionForm from "./ArtistSubmissionForm";
import {
  acceptArtistSubmissionAction,
  acceptBanAppealAction,
  acceptFilmSubmissionAction,
  refuseArtistSubmissionAction,
  refuseFilmSubmissionAction,
  rejectBanAppealAction,
  updateArtistSubmissionAction,
  updateFilmSubmissionAction,
} from "./actions";
import { Avatar, CheckIcon, ConfirmButton, CrossIcon, formatAgo, formatDay } from "../inbox-parts";
import { plural } from "../ContentList";
import type { Artist } from "@/data/types";
import { describeReleaseRequest } from "@/lib/release-request";
import type { AdminArtistRequest, AdminBanAppeal, AdminFilmRequest } from "@/db/queries";
import shared from "../shared.module.css";
import list from "../films/films.module.css";
import styles from "../inbox.module.css";

type Status = "pending" | "accepted" | "refused";

type Request =
  | { kind: "film"; id: string; status: Status; createdAt: string; data: AdminFilmRequest }
  | { kind: "artist"; id: string; status: Status; createdAt: string; data: AdminArtistRequest }
  | { kind: "appeal"; id: string; status: Status; createdAt: string; data: AdminBanAppeal };

const PAGE_SIZE = 6;
const TYPE_OPTIONS = ["Tous les types", "Films et séries", "Artistes", "Débannissements"];
const STATUS_OPTIONS = ["En attente", "Traitées", "Toutes"];
const SORT_OPTIONS = ["Plus récentes", "Plus anciennes"];

const statusOf = (s: string): Status => (s === "pending" ? "pending" : s === "accepted" ? "accepted" : "refused");

function StatusPill({ status }: { status: Status }) {
  if (status === "pending") return <span className={`${styles.status} ${styles.statusPending}`}>En attente</span>;
  if (status === "accepted") return <span className={`${styles.status} ${styles.statusDone}`}>Acceptée</span>;
  return <span className={`${styles.status} ${styles.statusRefused}`}>Refusée</span>;
}

function Side({ request, now }: { request: Request; now: number }) {
  return (
    <div className={styles.side}>
      <span className={styles.date} title={formatDay(request.createdAt)}>
        {formatAgo(request.createdAt, now)}
      </span>
      <StatusPill status={request.status} />
    </div>
  );
}

const RELEASE_LABEL: Record<AdminFilmRequest["releaseRequest"]["mode"], string> = {
  now: "Sortie",
  scheduled: "Date demandée",
  premiere: "Avant-première demandée",
  announcement: "Annonce",
};

function filmLabel(s: AdminFilmRequest) {
  if (!s.seriesTitle) return s.title;
  if (s.releaseRequest.mode === "announcement") return `${s.seriesTitle} · annonce de la série`;
  return `${s.seriesTitle} · S${s.seasonNumber ?? 1}E${s.episodeNumber ?? 1} « ${s.title} »`;
}

function FilmRequest({
  request,
  now,
  identities,
  categories,
}: {
  request: Extract<Request, { kind: "film" }>;
  now: number;
  identities: Artist[];
  categories: string[];
}) {
  const s = request.data;
  const [editOpen, setEditOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [identityId, setIdentityId] = useState(s.artistId ?? s.studioId ?? identities[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const identityLabel = (a: Artist) => (a.isStudio ? `${a.name} (studio)` : a.name);
  const selected = identities.find((a) => a.id === identityId);

  return (
    <article className={`${styles.item} ${request.status === "pending" ? styles.itemPending : ""}`}>
      <div className={styles.head}>
        <span className={styles.thumb}>{s.poster && <Image src={s.poster} alt="" fill sizes="84px" unoptimized />}</span>
        <div className={styles.main}>
          <span className={styles.title}>{filmLabel(s)}</span>
          <span className={styles.meta}>
            <span className={styles.tag}>
              {s.releaseRequest.mode === "announcement"
                ? s.seriesTitle
                  ? "Annonce de série"
                  : "Annonce de film"
                : s.seriesTitle
                  ? "Épisode"
                  : "Film"}
            </span>
            <span>{s.category}</span>
            <span>{s.year}</span>
            {s.durationMinutes > 0 && <span>{s.durationMinutes} min</span>}
            <span>{s.rating}</span>
          </span>
          <span className={styles.meta}>
            <span>
              Proposé par <strong>{s.artistName}</strong>
            </span>
            <span>Compte : {s.accountName ?? "supprimé"}</span>
            <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
          </span>
        </div>
        <Side request={request} now={now} />
      </div>

      <p className={`${styles.body} ${expanded ? "" : styles.clamp}`}>{s.synopsis}</p>

      <div className={styles.releaseLine}>
        <span className={`${styles.releaseMode} ${styles[`release_${s.releaseRequest.mode}`]}`}>
          {RELEASE_LABEL[s.releaseRequest.mode]}
        </span>
        <span>{describeReleaseRequest(s.releaseRequest)}</span>
        {s.releaseRequest.replacesId && (
          <span className={styles.tag}>Vidéo d&apos;une annonce déjà publiée : la fiche deviendra le film</span>
        )}
      </div>
      {s.releaseRequest.note && (
        <div className={styles.quote}>
          <span className={styles.quoteLabel}>Message de {s.artistName}</span>
          <p className={styles.body}>{s.releaseRequest.note}</p>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          {s.synopsis.length > 220 && (
            <button type="button" className={styles.linkBtn} onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Réduire" : "Lire tout"}
            </button>
          )}
          {s.videoUrl && (
            <a className={styles.linkBtn} href={s.videoUrl} target="_blank" rel="noreferrer">
              Voir la vidéo
            </a>
          )}
          {(s.releaseRequest.trailers ?? []).map((t, i) => (
            <a key={i} className={styles.linkBtn} href={t.videoUrl} target="_blank" rel="noreferrer">
              {t.title}
            </a>
          ))}
        </div>
        {request.status === "pending" && (
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => setEditOpen(true)}>
              Modifier
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnAccept}`}
              onClick={() => {
                setError(null);
                setAcceptOpen(true);
              }}
              disabled={identities.length === 0}
            >
              {CheckIcon}
              Accepter
            </button>
            <ConfirmButton
              label="Refuser"
              icon={CrossIcon}
              className={`${styles.btn} ${styles.btnDanger}`}
              title="Refuser la demande"
              text={`Refuser « ${s.title} » ? Le contenu ne sera pas ajouté, et la personne sera prévenue.`}
              confirmLabel="Refuser"
              danger
              action={() => refuseFilmSubmissionAction(s.id)}
            />
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Modifier la demande « ${s.title} »`}>
        <FilmSubmissionForm
          categories={categories}
          initial={s}
          pending={isPending}
          error={editError}
          onSubmit={(formData) =>
            startTransition(async () => {
              const result = await updateFilmSubmissionAction(s.id, formData);
              if (result.error) setEditError(result.error);
              else {
                setEditError(null);
                setEditOpen(false);
              }
            })
          }
        />
      </Modal>
      <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title={`Accepter « ${s.title} »`}>
        <p className={shared.confirmText}>
          À quel artiste ou studio attribuer ce contenu ? Il sera ajouté au catalogue et la personne sera prévenue.
        </p>
        <p className={shared.confirmText}>
          <strong>Sortie :</strong> {describeReleaseRequest(s.releaseRequest)}. Pour la changer, utilise « Modifier »
          avant d&apos;accepter.
        </p>
        <div className={shared.field} style={{ marginBottom: 20 }}>
          <Dropdown
            options={identities.map(identityLabel)}
            value={selected ? identityLabel(selected) : "Choisir…"}
            onChange={(label) => setIdentityId(identities.find((a) => identityLabel(a) === label)?.id ?? "")}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={shared.confirmActions}>
          <button type="button" className={shared.cancelBtn} onClick={() => setAcceptOpen(false)} disabled={isPending}>
            Annuler
          </button>
          <button
            type="button"
            className={shared.submitBtn}
            disabled={isPending || !selected}
            onClick={() =>
              startTransition(async () => {
                const result = await acceptFilmSubmissionAction(s.id, identityId, selected?.isStudio ?? false);
                if (result.error) setError(result.error);
                else setAcceptOpen(false);
              })
            }
          >
            {isPending ? "…" : "Accepter et ajouter"}
          </button>
        </div>
      </Modal>
    </article>
  );
}

function ArtistRequest({ request, now }: { request: Extract<Request, { kind: "artist" }>; now: number }) {
  const s = request.data;
  const [editOpen, setEditOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <article className={`${styles.item} ${request.status === "pending" ? styles.itemPending : ""}`}>
      <div className={styles.head}>
        <Avatar src={s.avatar} name={s.name} />
        <div className={styles.main}>
          <span className={styles.title}>{s.name}</span>
          <span className={styles.meta}>
            <span className={styles.tag}>Artiste</span>
            <span>Compte : {s.accountName ?? "supprimé"}</span>
            <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
            {s.portfolioUrl && (
              <a href={s.portfolioUrl} target="_blank" rel="noreferrer">
                Portfolio
              </a>
            )}
          </span>
        </div>
        <Side request={request} now={now} />
      </div>

      <p className={`${styles.body} ${expanded ? "" : styles.clamp}`}>{s.bio}</p>

      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          {s.bio.length > 220 && (
            <button type="button" className={styles.linkBtn} onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Réduire" : "Lire tout"}
            </button>
          )}
        </div>
        {request.status === "pending" && (
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => setEditOpen(true)}>
              Modifier
            </button>
            <ConfirmButton
              label="Accepter"
              icon={CheckIcon}
              className={`${styles.btn} ${styles.btnAccept}`}
              title={`Accepter ${s.name}`}
              text={`Créer le profil d'artiste de ${s.name}, rattaché au compte ${s.accountName ?? "?"} ? La personne sera prévenue.`}
              confirmLabel="Accepter"
              action={() => acceptArtistSubmissionAction(s.id)}
            />
            <ConfirmButton
              label="Refuser"
              icon={CrossIcon}
              className={`${styles.btn} ${styles.btnDanger}`}
              title={`Refuser ${s.name}`}
              text={`Refuser la demande de ${s.name} ? Aucun profil ne sera créé, et la personne sera prévenue.`}
              confirmLabel="Refuser"
              danger
              action={() => refuseArtistSubmissionAction(s.id)}
            />
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Modifier la demande de ${s.name}`}>
        <ArtistSubmissionForm
          initial={s}
          pending={isPending}
          onSubmit={(formData) =>
            startTransition(async () => {
              await updateArtistSubmissionAction(s.id, formData);
              setEditOpen(false);
            })
          }
        />
      </Modal>
    </article>
  );
}

function AppealRequest({ request, now }: { request: Extract<Request, { kind: "appeal" }>; now: number }) {
  const a = request.data;
  return (
    <article className={`${styles.item} ${request.status === "pending" ? styles.itemPending : ""}`}>
      <div className={styles.head}>
        <Avatar name={a.userName} />
        <div className={styles.main}>
          <span className={styles.title}>{a.userName}</span>
          <span className={styles.meta}>
            <span className={styles.tag}>Débannissement</span>
            <a href={`mailto:${a.userEmail}`}>{a.userEmail}</a>
            {request.status !== "pending" && <span>{a.stillBanned ? "Toujours banni" : "Débanni"}</span>}
          </span>
        </div>
        <Side request={request} now={now} />
      </div>
      <div className={styles.quote}>
        <span className={styles.quoteLabel}>Raison du bannissement</span>
        <p className={styles.body}>{a.banReason ?? "Aucune raison indiquée."}</p>
      </div>
      <div className={styles.quote}>
        <span className={styles.quoteLabel}>Sa demande</span>
        <p className={styles.body}>{a.message}</p>
      </div>
      {request.status === "pending" && (
        <div className={styles.actions}>
          <ConfirmButton
            label="Débannir"
            icon={CheckIcon}
            className={`${styles.btn} ${styles.btnAccept}`}
            title={`Débannir ${a.userName}`}
            text={`${a.userName} pourra de nouveau se connecter.`}
            confirmLabel="Débannir"
            action={() => acceptBanAppealAction(a.id)}
          />
          <ConfirmButton
            label="Refuser"
            icon={CrossIcon}
            className={`${styles.btn} ${styles.btnDanger}`}
            title="Refuser la demande"
            text={`Refuser la demande de ${a.userName} ? Le compte reste banni.`}
            confirmLabel="Refuser"
            danger
            action={() => rejectBanAppealAction(a.id)}
          />
        </div>
      )}
    </article>
  );
}

export default function RequestsManager({
  films,
  artists,
  appeals,
  identities,
  categories,
  now,
}: {
  films: AdminFilmRequest[];
  artists: AdminArtistRequest[];
  appeals: AdminBanAppeal[];
  identities: Artist[];
  categories: string[];
  // From the server, so relative dates render the same on both sides.
  now: number;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(0);

  const requests = useMemo<Request[]>(
    () => [
      ...films.map((d) => ({ kind: "film" as const, id: d.id, status: statusOf(d.status), createdAt: d.createdAt, data: d })),
      ...artists.map((d) => ({
        kind: "artist" as const,
        id: d.id,
        status: statusOf(d.status),
        createdAt: d.createdAt,
        data: d,
      })),
      ...appeals.map((d) => ({
        kind: "appeal" as const,
        id: d.id,
        status: statusOf(d.status),
        createdAt: d.createdAt,
        data: d,
      })),
    ],
    [films, artists, appeals]
  );

  const pendingOf = (kind: Request["kind"]) => requests.filter((r) => r.kind === kind && r.status === "pending").length;
  const pendingTotal = requests.filter((r) => r.status === "pending").length;

  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const kindOf: Record<string, Request["kind"] | null> = {
      "Tous les types": null,
      "Films et séries": "film",
      Artistes: "artist",
      Débannissements: "appeal",
    };
    const wantedKind = kindOf[type];
    const filtered = requests.filter((r) => {
      if (wantedKind && r.kind !== wantedKind) return false;
      if (status === "En attente" && r.status !== "pending") return false;
      if (status === "Traitées" && r.status === "pending") return false;
      if (needle) {
        const d = r.data as unknown as Record<string, unknown>;
        const haystack = Object.values(d)
          .filter((v) => typeof v === "string")
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    const dir = sort === "Plus anciennes" ? 1 : -1;
    return filtered.sort((a, b) => dir * a.createdAt.localeCompare(b.createdAt));
  }, [requests, type, status, needle, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageItems = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(0);
    };
  const showPending = (nextType: string) => {
    setType(nextType);
    setStatus("En attente");
    setPage(0);
  };

  const chips = [
    { label: "Demandes en attente", value: pendingTotal, accent: pendingTotal > 0, onClick: () => showPending(TYPE_OPTIONS[0]) },
    { label: "Films et séries à valider", value: pendingOf("film"), onClick: () => showPending("Films et séries") },
    { label: "Artistes à valider", value: pendingOf("artist"), onClick: () => showPending("Artistes") },
    { label: "Débannissements à traiter", value: pendingOf("appeal"), onClick: () => showPending("Débannissements") },
  ];

  return (
    <div className={list.manager}>
      <div className={list.summary}>
        {chips.map((c) => (
          <button
            key={c.label}
            type="button"
            className={`${list.chip} ${c.accent ? list.chipAccent : ""}`}
            onClick={c.onClick}
          >
            <span className={list.chipValue}>{c.value}</span>
            <span className={list.chipLabel}>{c.label}</span>
          </button>
        ))}
      </div>

      <div className={list.toolbar}>
        <div className={list.search}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Titre, nom, email…"
            value={query}
            onChange={(e) => withReset(setQuery)(e.target.value)}
          />
        </div>
        <div className={list.filter}>
          <Dropdown options={TYPE_OPTIONS} value={type} onChange={withReset(setType)} />
        </div>
        <div className={list.filter}>
          <Dropdown options={STATUS_OPTIONS} value={status} onChange={withReset(setStatus)} />
        </div>
        <div className={list.filter}>
          <Dropdown options={SORT_OPTIONS} value={sort} onChange={withReset(setSort)} />
        </div>
      </div>

      <div className={list.resultsBar}>
        <span>{plural(visible.length, "demande")}</span>
      </div>

      {pageItems.length === 0 ? (
        <p className={styles.empty}>
          {status === "En attente" ? "Aucune demande en attente. Tout est à jour." : "Aucune demande ne correspond."}
        </p>
      ) : (
        <div className={styles.list}>
          {pageItems.map((r) =>
            r.kind === "film" ? (
              <FilmRequest key={r.id} request={r} now={now} identities={identities} categories={categories} />
            ) : r.kind === "artist" ? (
              <ArtistRequest key={r.id} request={r} now={now} />
            ) : (
              <AppealRequest key={r.id} request={r} now={now} />
            )
          )}
        </div>
      )}

      <AdminPager page={current} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}

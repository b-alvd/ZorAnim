"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal/Modal";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import { FormSection, Segmented, minutesFromSeconds } from "@/app/admin/films/FormParts";
import type { Artist, Film } from "@/data/types";
import { RATING_OPTIONS } from "@/lib/ratings";
import { proposeFilmAction, proposeSeriesAction } from "./submitActions";
import ReleasePicker, { RELEASE_DRAFT_NOW, TrailersEditor, draftToRequest, type ReleaseDraft } from "./ReleasePicker";
import type { ReleaseTrailer } from "@/lib/release-request";
import adminStyles from "@/app/admin/shared.module.css";
import styles from "./propose.module.css";

type ContentType = "film" | "series";

type MediaDraft = {
  title: string;
  synopsis: string;
  year: string;
  duration: string;
  poster: string;
  videoUrl: string;
};

type EpisodeDraft = MediaDraft & { season: string; number: string; release: ReleaseDraft };

const thisYear = () => String(new Date().getFullYear());

const emptyMedia = (): MediaDraft => ({
  title: "",
  synopsis: "",
  year: thisYear(),
  duration: "",
  poster: "",
  videoUrl: "",
});

// Window opened for a precise purpose from the creator space:
// - "announcement": the video of an announced film (fills that fiche);
// - "episode": new episode(s) of an existing series.
export type ProposePreset =
  | { kind: "announcement"; film: Film }
  | { kind: "episode"; seriesTitle: string; rating: string; category: string; season: number; number: number };

export function presetKey(p: ProposePreset | null): string {
  if (!p) return "free";
  return p.kind === "announcement" ? `announcement-${p.film.id}` : `episode-${p.seriesTitle}`;
}

const emptyEpisode = (previous?: EpisodeDraft): EpisodeDraft => ({
  ...emptyMedia(),
  year: previous?.year ?? thisYear(),
  season: previous?.season ?? "1",
  number: previous ? String(Number(previous.number || 0) + 1) : "1",
  // Same kind of release as the previous episode; dates to fill again.
  release: { ...RELEASE_DRAFT_NOW, mode: previous?.release.mode ?? "now" },
});

function mediaPayload(m: MediaDraft) {
  return {
    title: m.title,
    synopsis: m.synopsis,
    year: Number(m.year),
    durationMinutes: Number(m.duration),
    poster: m.poster,
    videoUrl: m.videoUrl,
  };
}

// Title, synopsis, year, length, poster and video of a film or an episode.
function MediaFields({
  value,
  onChange,
  idPrefix,
  titleLabel,
  announcement = false,
}: {
  value: MediaDraft;
  onChange: (patch: Partial<MediaDraft>) => void;
  idPrefix: string;
  titleLabel: string;
  // No video yet: neither the video nor the length is asked.
  announcement?: boolean;
}) {
  return (
    <>
      <div className={adminStyles.field}>
        <label htmlFor={`${idPrefix}-title`}>{titleLabel}</label>
        <input id={`${idPrefix}-title`} value={value.title} onChange={(e) => onChange({ title: e.target.value })} />
      </div>
      <div className={adminStyles.field}>
        <label htmlFor={`${idPrefix}-synopsis`}>Synopsis</label>
        <textarea
          id={`${idPrefix}-synopsis`}
          rows={3}
          value={value.synopsis}
          onChange={(e) => onChange({ synopsis: e.target.value })}
        />
      </div>
      <div className={adminStyles.row2}>
        <div className={adminStyles.field}>
          <label htmlFor={`${idPrefix}-year`}>Année</label>
          <input
            id={`${idPrefix}-year`}
            type="number"
            value={value.year}
            onChange={(e) => onChange({ year: e.target.value })}
          />
        </div>
        {!announcement && (
          <div className={adminStyles.field}>
            <label htmlFor={`${idPrefix}-duration`}>Durée (minutes)</label>
            <input
              id={`${idPrefix}-duration`}
              type="number"
              min={1}
              value={value.duration}
              onChange={(e) => onChange({ duration: e.target.value })}
            />
          </div>
        )}
      </div>
      <div className={adminStyles.field}>
        <label>Affiche</label>
        <FileUpload
          name={`${idPrefix}-poster`}
          label="Choisir une image"
          accept="image/*"
          value={value.poster}
          onChange={(poster) => onChange({ poster })}
          preview
        />
      </div>
      {!announcement && (
        <div className={adminStyles.field}>
          <label>Vidéo</label>
          <FileUpload
            name={`${idPrefix}-video`}
            label="Choisir une vidéo"
            accept="video/*"
            value={value.videoUrl}
            onChange={(videoUrl) => onChange({ videoUrl })}
            onDurationChange={(seconds) => onChange({ duration: String(minutesFromSeconds(seconds)) })}
            maxSizeMB={100}
          />
        </div>
      )}
    </>
  );
}

// "Proposer un contenu": a film or a series (with its episodes), its
// requested release and a message to the team. Sent as submissions that the
// admin accepts, modifies or refuses.
export default function ProposeDialog({
  open,
  onClose,
  identities,
  defaultIdentityId,
  categories,
  preset = null,
}: {
  open: boolean;
  onClose: () => void;
  identities: Artist[];
  defaultIdentityId: string;
  categories: string[];
  preset?: ProposePreset | null;
}) {
  const router = useRouter();
  const fromAnnouncement = preset?.kind === "announcement" ? preset.film : null;
  const forSeries = preset?.kind === "episode" ? preset : null;
  const [identityId, setIdentityId] = useState(defaultIdentityId);
  const [type, setType] = useState<ContentType>(forSeries ? "series" : "film");
  const [rating, setRating] = useState(fromAnnouncement?.rating || forSeries?.rating || RATING_OPTIONS[0]);
  const [category, setCategory] = useState(fromAnnouncement?.category || forSeries?.category || categories[0]);
  const [film, setFilm] = useState<MediaDraft>(() =>
    fromAnnouncement
      ? {
          ...emptyMedia(),
          title: fromAnnouncement.title,
          synopsis: fromAnnouncement.synopsis,
          year: String(fromAnnouncement.year),
          poster: fromAnnouncement.poster,
        }
      : emptyMedia(),
  );
  const [filmRelease, setFilmRelease] = useState<ReleaseDraft>(RELEASE_DRAFT_NOW);
  const [seriesTitle, setSeriesTitle] = useState(forSeries?.seriesTitle ?? "");
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>(() => [
    forSeries
      ? { ...emptyEpisode(), season: String(forSeries.season), number: String(forSeries.number) }
      : emptyEpisode(),
  ]);
  // Series announced before any episode: its fiche and trailers only.
  const [announceSeries, setAnnounceSeries] = useState(false);
  const [seriesFiche, setSeriesFiche] = useState<MediaDraft>(emptyMedia);
  const [seriesTrailers, setSeriesTrailers] = useState<ReleaseTrailer[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const identityLabel = (a: Artist) => (a.isStudio ? `${a.name} (studio)` : a.name);
  const selected = identities.find((a) => a.id === identityId) ?? identities[0];

  const reset = () => {
    setType(forSeries ? "series" : "film");
    setFilm(emptyMedia());
    setFilmRelease(RELEASE_DRAFT_NOW);
    setSeriesTitle(forSeries?.seriesTitle ?? "");
    setEpisodes([emptyEpisode()]);
    setAnnounceSeries(false);
    setSeriesFiche(emptyMedia());
    setSeriesTrailers([]);
    setNote("");
    setError(null);
    setSent(false);
  };

  const close = () => {
    if (sent) reset();
    onClose();
  };

  const updateEpisode = (index: number, patch: Partial<EpisodeDraft>) =>
    setEpisodes((list) => list.map((ep, i) => (i === index ? { ...ep, ...patch } : ep)));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result =
        type === "film"
          ? await proposeFilmAction({
              identityId: selected.id,
              rating,
              category,
              ...mediaPayload(film),
              release: draftToRequest(filmRelease, note.trim() || null),
              replacesAnnouncementId: fromAnnouncement?.id ?? null,
            })
          : await proposeSeriesAction({
              identityId: selected.id,
              seriesTitle,
              rating,
              category,
              note,
              announcement: announceSeries
                ? {
                    synopsis: seriesFiche.synopsis,
                    year: Number(seriesFiche.year),
                    poster: seriesFiche.poster,
                    trailers: seriesTrailers.filter((t) => t.videoUrl),
                  }
                : null,
              episodes: (announceSeries ? [] : episodes).map((ep) => ({
                ...mediaPayload(ep),
                seasonNumber: Number(ep.season),
                episodeNumber: Number(ep.number),
                release: draftToRequest(ep.release),
              })),
            });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSent(true);
      router.refresh();
    });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        fromAnnouncement
          ? `Proposer la vidéo de « ${fromAnnouncement.title} »`
          : forSeries
            ? `Proposer des épisodes de « ${forSeries.seriesTitle} »`
            : "Proposer un contenu"
      }
      fixedHeight
    >
      {sent ? (
        <div className={styles.sent}>
          <span className={styles.sentIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          <h3>Proposition envoyée</h3>
          <p>
            L&apos;équipe va la regarder. Tu seras prévenu par une notification dès qu&apos;elle est acceptée, avec la
            date de sortie retenue.
          </p>
          <div className={styles.sentActions}>
            <button type="button" className={adminStyles.submitBtn} onClick={close}>
              Fermer
            </button>
            <button type="button" className={styles.linkBtn} onClick={reset}>
              Proposer autre chose
            </button>
          </div>
        </div>
      ) : (
        <div className={adminStyles.form}>
          {preset && (
            <p className={styles.presetNote}>
              {fromAnnouncement
                ? "Ajoute la vidéo et choisis la sortie. Une fois acceptée par l'équipe, ton annonce devient le film : même page, mêmes bandes-annonces, et les membres qui l'ont mise dans leur liste la gardent."
                : "Chaque épisode est vérifié par l'équipe avant sa sortie, à la date que tu choisis."}
            </p>
          )}
          {!preset && (
            <div className={adminStyles.row2}>
              <div className={adminStyles.field}>
                <label>Publié par</label>
                <Dropdown
                  options={identities.map(identityLabel)}
                  value={identityLabel(selected)}
                  onChange={(label) =>
                    setIdentityId(identities.find((a) => identityLabel(a) === label)?.id ?? identityId)
                  }
                />
              </div>
              <div className={adminStyles.field}>
                <label>Type de contenu</label>
                <Segmented
                  options={[
                    { value: "film" as const, label: "Film" },
                    { value: "series" as const, label: "Série" },
                  ]}
                  value={type}
                  onChange={(t) => {
                    setType(t);
                    setError(null);
                  }}
                />
              </div>
            </div>
          )}

          {type === "film" ? (
            <>
              <FormSection title="Le film">
                <MediaFields
                  value={film}
                  onChange={(patch) => setFilm((f) => ({ ...f, ...patch }))}
                  idPrefix="film"
                  titleLabel="Titre du film"
                  announcement={filmRelease.mode === "announcement"}
                />
              </FormSection>
              <FormSection title="Classement">
                <div className={adminStyles.row2}>
                  <div className={adminStyles.field}>
                    <label>Classification</label>
                    <Dropdown options={RATING_OPTIONS} value={rating} onChange={setRating} />
                  </div>
                  <div className={adminStyles.field}>
                    <label>Catégorie</label>
                    <Dropdown options={categories} value={category} onChange={setCategory} />
                  </div>
                </div>
              </FormSection>
              <FormSection title="Sortie souhaitée">
                <ReleasePicker
                  value={filmRelease}
                  onChange={setFilmRelease}
                  idPrefix="film"
                  allowAnnouncement={!fromAnnouncement}
                />
              </FormSection>
            </>
          ) : (
            <>
              <FormSection title="La série">
                <div className={adminStyles.field}>
                  <label htmlFor="series-title">Titre de la série</label>
                  <input
                    id="series-title"
                    value={seriesTitle}
                    onChange={(e) => setSeriesTitle(e.target.value)}
                    readOnly={!!forSeries}
                  />
                </div>
                <div className={adminStyles.row2}>
                  <div className={adminStyles.field}>
                    <label>Classification</label>
                    <Dropdown options={RATING_OPTIONS} value={rating} onChange={setRating} />
                  </div>
                  <div className={adminStyles.field}>
                    <label>Catégorie</label>
                    <Dropdown options={categories} value={category} onChange={setCategory} />
                  </div>
                </div>
                {!forSeries && (
                  <label className={styles.announceSwitch}>
                    <input
                      type="checkbox"
                      checked={announceSeries}
                      onChange={(e) => {
                        setAnnounceSeries(e.target.checked);
                        setError(null);
                      }}
                    />
                    <span>
                      <strong>Annoncer la série</strong>
                      <span className={styles.hint}>
                        Pas encore d&apos;épisode : la fiche et ses bandes-annonces apparaissent dans « Bientôt sur
                        ZorAnim ». Tes épisodes s&apos;y ajouteront quand tu les proposeras.
                      </span>
                    </span>
                  </label>
                )}
              </FormSection>

              {announceSeries && (
                <FormSection title="L'annonce">
                  <div className={adminStyles.field}>
                    <label htmlFor="fiche-synopsis">Synopsis de la série</label>
                    <textarea
                      id="fiche-synopsis"
                      rows={3}
                      value={seriesFiche.synopsis}
                      onChange={(e) => setSeriesFiche((f) => ({ ...f, synopsis: e.target.value }))}
                    />
                  </div>
                  <div className={adminStyles.field}>
                    <label htmlFor="fiche-year">Année</label>
                    <input
                      id="fiche-year"
                      type="number"
                      value={seriesFiche.year}
                      onChange={(e) => setSeriesFiche((f) => ({ ...f, year: e.target.value }))}
                    />
                  </div>
                  <div className={adminStyles.field}>
                    <label>Affiche</label>
                    <FileUpload
                      name="fiche-poster"
                      label="Choisir une image"
                      accept="image/*"
                      value={seriesFiche.poster}
                      onChange={(poster) => setSeriesFiche((f) => ({ ...f, poster }))}
                      preview
                    />
                  </div>
                  <div className={adminStyles.field}>
                    <label>Bandes-annonces</label>
                    <TrailersEditor value={seriesTrailers} onChange={setSeriesTrailers} idPrefix="fiche" />
                  </div>
                </FormSection>
              )}

              {!announceSeries &&
                episodes.map((ep, index) => (
                  <FormSection key={index} title={`Épisode S${ep.season || "?"}E${ep.number || "?"}`}>
                    <div className={adminStyles.row2}>
                      <div className={adminStyles.field}>
                        <label htmlFor={`ep-${index}-season`}>Saison</label>
                        <input
                          id={`ep-${index}-season`}
                          type="number"
                          min={1}
                          value={ep.season}
                          onChange={(e) => updateEpisode(index, { season: e.target.value })}
                        />
                      </div>
                      <div className={adminStyles.field}>
                        <label htmlFor={`ep-${index}-number`}>Numéro</label>
                        <input
                          id={`ep-${index}-number`}
                          type="number"
                          min={1}
                          value={ep.number}
                          onChange={(e) => updateEpisode(index, { number: e.target.value })}
                        />
                      </div>
                    </div>
                    <MediaFields
                      value={ep}
                      onChange={(patch) => updateEpisode(index, patch)}
                      idPrefix={`ep-${index}`}
                      titleLabel="Titre de l'épisode"
                    />
                    <div className={adminStyles.field}>
                      <label>Sortie souhaitée</label>
                      <ReleasePicker
                        value={ep.release}
                        onChange={(release) => updateEpisode(index, { release })}
                        idPrefix={`ep-${index}`}
                      />
                    </div>
                    {episodes.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeEpisode}
                        onClick={() => setEpisodes((list) => list.filter((_, i) => i !== index))}
                      >
                        Retirer cet épisode
                      </button>
                    )}
                  </FormSection>
                ))}
              {!announceSeries && (
                <button
                  type="button"
                  className={styles.addEpisode}
                  onClick={() => setEpisodes((list) => [...list, emptyEpisode(list[list.length - 1])])}
                >
                  + Ajouter un épisode
                </button>
              )}
            </>
          )}

          <FormSection title="Message pour l'équipe">
            <div className={adminStyles.field}>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Facultatif : une précision sur la sortie, une demande particulière…"
              />
            </div>
          </FormSection>

          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.hint}>
            Ta proposition est vérifiée par l&apos;équipe, qui peut ajuster les informations ou la date de sortie avant
            de la publier.
          </p>
          <button type="button" className={adminStyles.submitBtn} onClick={submit} disabled={isPending}>
            {isPending
              ? "Envoi…"
              : type === "film" || announceSeries
                ? "Envoyer la proposition"
                : `Envoyer la proposition (${episodes.length} épisode${episodes.length > 1 ? "s" : ""})`}
          </button>
        </div>
      )}
    </Modal>
  );
}

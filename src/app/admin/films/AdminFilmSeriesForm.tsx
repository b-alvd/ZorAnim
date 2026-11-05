"use client";

import { useState, useTransition } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import FilmForm from "./FilmForm";
import {
  EMPTY_RELEASE,
  FormSection,
  TrailersEditor,
  ReleaseFields,
  Segmented,
  minutesFromSeconds,
  releaseComplete,
  type ReleaseValue,
  type TrailerDraft,
} from "./FormParts";
import { createFilmAction, createSeriesAction } from "./actions";
import type { Artist } from "@/data/types";
import { RATING_OPTIONS } from "@/lib/ratings";
import adminStyles from "../shared.module.css";
import styles from "./films.module.css";

const SEASON_OPTIONS = ["Saison 1", "Saison 2", "Saison 3", "Saison 4", "Saison 5", "Saison 6"];

type EpisodeDraft = {
  key: number;
  title: string;
  synopsis: string;
  year: number;
  durationMinutes: number;
  seasonNumber: number;
  episodeNumber: number;
  poster: string;
  videoUrl: string;
  videoDurationSeconds: number | null;
  release: ReleaseValue;
};

let nextKey = 0;

const emptyEpisode = (previous?: EpisodeDraft): EpisodeDraft => ({
  key: nextKey++,
  title: "",
  synopsis: "",
  year: previous?.year ?? new Date().getFullYear(),
  durationMinutes: 0,
  seasonNumber: previous?.seasonNumber ?? 1,
  episodeNumber: previous ? previous.episodeNumber + 1 : 1,
  poster: "",
  videoUrl: "",
  videoDurationSeconds: null,
  release: EMPTY_RELEASE,
});

const episodeLabel = (ep: EpisodeDraft) => `S${ep.seasonNumber || "?"} · Épisode ${ep.episodeNumber || "?"}`;

const episodeReady = (ep: EpisodeDraft) =>
  !!ep.title.trim() &&
  !!ep.synopsis.trim() &&
  ep.year > 0 &&
  ep.durationMinutes > 0 &&
  ep.episodeNumber > 0 &&
  !!ep.poster &&
  !!ep.videoUrl &&
  releaseComplete(ep.release);

const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

export default function AdminFilmSeriesForm({
  artists,
  categories,
  pending: filmPending,
  onDone,
}: {
  artists: Artist[];
  categories: string[];
  pending?: boolean;
  onDone: () => void;
}) {
  const [contentType, setContentType] = useState<"film" | "series">("film");
  const [rating, setRating] = useState(RATING_OPTIONS[0]);
  const [category, setCategory] = useState(categories[0]);
  const [artistId, setArtistId] = useState(artists[0]?.id ?? "");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [trailers, setTrailers] = useState<TrailerDraft[]>([]);
  // "announce": the series is presented in "Bientôt" before any episode.
  const [mode, setMode] = useState<"episodes" | "announce">("episodes");
  const [announcement, setAnnouncement] = useState({ poster: "", synopsis: "", year: new Date().getFullYear() });
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>(() => [emptyEpisode()]);
  const [openKey, setOpenKey] = useState<number | null>(episodes[0].key);
  const [isPending, startTransition] = useTransition();

  const artistNames = artists.map((a) => (a.isStudio ? `${a.name} (studio)` : a.name));
  const selectedArtist = artists.find((a) => a.id === artistId);
  const selectedArtistName = selectedArtist
    ? selectedArtist.isStudio
      ? `${selectedArtist.name} (studio)`
      : selectedArtist.name
    : artistNames[0];

  const updateEpisode = (key: number, patch: Partial<EpisodeDraft>) =>
    setEpisodes((prev) => prev.map((ep) => (ep.key === key ? { ...ep, ...patch } : ep)));
  const updateRelease = (key: number, patch: Partial<ReleaseValue>) =>
    setEpisodes((prev) => prev.map((ep) => (ep.key === key ? { ...ep, release: { ...ep.release, ...patch } } : ep)));
  const addEpisode = () => {
    const ep = emptyEpisode(episodes[episodes.length - 1]);
    setEpisodes((prev) => [...prev, ep]);
    setOpenKey(ep.key);
  };
  const removeEpisode = (key: number) => setEpisodes((prev) => prev.filter((ep) => ep.key !== key));

  const announcementReady = !!announcement.poster && !!announcement.synopsis.trim() && announcement.year > 0;
  const seriesReady =
    !!seriesTitle.trim() &&
    !!selectedArtist &&
    (mode === "announce" ? announcementReady : episodes.length > 0 && episodes.every(episodeReady));

  const handleSubmitSeries = () => {
    if (!seriesReady || !selectedArtist) return;
    startTransition(async () => {
      await createSeriesAction({
        artistId: selectedArtist.id,
        isStudio: selectedArtist.isStudio,
        seriesTitle: seriesTitle.trim(),
        rating,
        category,
        isNew,
        trailers: trailers.map(({ title, videoUrl }) => ({ title, videoUrl })),
        announcement: mode === "announce" ? announcement : null,
        // Release dates are datetime-local strings: converted to ISO here, in
        // the browser, so they resolve against the admin's own local time.
        episodes: (mode === "announce" ? [] : episodes).map(({ release, ...draft }) => ({
          title: draft.title,
          synopsis: draft.synopsis,
          year: draft.year,
          durationMinutes: draft.durationMinutes,
          seasonNumber: draft.seasonNumber,
          episodeNumber: draft.episodeNumber,
          poster: draft.poster,
          videoUrl: draft.videoUrl,
          videoDurationSeconds: draft.videoDurationSeconds,
          premiereAt: toIso(release.premiereAt),
          releaseAt: toIso(release.releaseAt),
          premiereBanner: release.premiereBanner || null,
          releaseBanner: release.releaseBanner || null,
          premiereAdUrl: release.premiereAdUrl || null,
          premiereAdDurationSeconds: release.premiereAdDurationSeconds,
        })),
      });
      onDone();
    });
  };

  return (
    <div className={`${adminStyles.form} ${styles.filmForm}`}>
      <Segmented
        options={[
          { value: "film", label: "Film" },
          { value: "series", label: "Série" },
        ]}
        value={contentType}
        onChange={setContentType}
      />

      {contentType === "film" ? (
        <FilmForm
          artists={artists}
          categories={categories}
          pending={filmPending}
          allowSeries={false}
          onSubmit={(formData) =>
            startTransition(async () => {
              await createFilmAction(formData);
              onDone();
            })
          }
        />
      ) : (
        <>
          <FormSection title="Série">
            <div className={adminStyles.field}>
              <label htmlFor="seriesTitle">Titre de la série</label>
              <input id="seriesTitle" value={seriesTitle} onChange={(e) => setSeriesTitle(e.target.value)} required />
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
            <div className={adminStyles.field}>
              <label>Artiste ou studio</label>
              <Dropdown
                options={artistNames}
                value={selectedArtistName}
                onChange={(name) => {
                  const found = artists.find((a) => (a.isStudio ? `${a.name} (studio)` : a.name) === name);
                  if (found) setArtistId(found.id);
                }}
              />
            </div>
            <div className={adminStyles.field}>
              <label>Bandes-annonces (facultatif)</label>
              <TrailersEditor value={trailers} onChange={setTrailers} namePrefix="series-trailer" />
            </div>
          </FormSection>

          <Segmented
            options={[
              { value: "episodes", label: "Avec épisodes" },
              { value: "announce", label: "Annonce (pas encore d'épisode)" },
            ]}
            value={mode}
            onChange={setMode}
          />

          {mode === "announce" ? (
            <FormSection title="Fiche d'annonce">
              <p className={styles.formHint}>
                La série apparaît dans « Bientôt sur ZorAnim » avec ses bandes-annonces. Au premier épisode ajouté, la
                fiche s&apos;efface d&apos;elle-même (ses favoris passent sur l&apos;épisode).
              </p>
              <div className={adminStyles.field}>
                <label>Synopsis</label>
                <textarea
                  rows={3}
                  value={announcement.synopsis}
                  onChange={(e) => setAnnouncement((a) => ({ ...a, synopsis: e.target.value }))}
                  required
                />
              </div>
              <div className={adminStyles.field}>
                <label>Année</label>
                <input
                  type="number"
                  value={announcement.year || ""}
                  onChange={(e) => setAnnouncement((a) => ({ ...a, year: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className={adminStyles.field}>
                <label>Affiche</label>
                <FileUpload
                  allowUrl
                  name="announcement-poster"
                  label="Choisir une image"
                  accept="image/*"
                  value={announcement.poster}
                  onChange={(url) => setAnnouncement((a) => ({ ...a, poster: url }))}
                  preview
                />
              </div>
            </FormSection>
          ) : (
            <FormSection title={`Épisodes (${episodes.length})`}>
              <div className={styles.episodes}>
                {episodes.map((episode) => {
                  const open = openKey === episode.key;
                  const ready = episodeReady(episode);
                  return (
                    <div key={episode.key} className={`${styles.episodeCard} ${open ? styles.episodeCardOpen : ""}`}>
                      <button
                        type="button"
                        className={styles.episodeCardHeader}
                        onClick={() => setOpenKey(open ? null : episode.key)}
                        aria-expanded={open}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                        >
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                        <span className={styles.episodeCardLabel}>{episodeLabel(episode)}</span>
                        <span className={styles.episodeCardTitle}>{episode.title || "Sans titre"}</span>
                        <span className={`${styles.episodeCardState} ${ready ? styles.episodeCardReady : ""}`}>
                          {ready ? "Prêt" : "À compléter"}
                        </span>
                      </button>

                      {open && (
                        <div className={styles.episodeCardBody}>
                          <div className={adminStyles.row2}>
                            <div className={adminStyles.field}>
                              <label>Saison</label>
                              <Dropdown
                                options={SEASON_OPTIONS}
                                value={`Saison ${episode.seasonNumber}`}
                                onChange={(label) =>
                                  updateEpisode(episode.key, { seasonNumber: Number(label.replace("Saison ", "")) })
                                }
                              />
                            </div>
                            <div className={adminStyles.field}>
                              <label>Numéro d&apos;épisode</label>
                              <input
                                value={episode.episodeNumber || ""}
                                onChange={(e) => updateEpisode(episode.key, { episodeNumber: Number(e.target.value) })}
                                type="number"
                                min={1}
                                required
                              />
                            </div>
                          </div>
                          <div className={adminStyles.field}>
                            <label>Titre de l&apos;épisode</label>
                            <input
                              value={episode.title}
                              onChange={(e) => updateEpisode(episode.key, { title: e.target.value })}
                              required
                            />
                          </div>
                          <div className={adminStyles.field}>
                            <label>Synopsis</label>
                            <textarea
                              value={episode.synopsis}
                              onChange={(e) => updateEpisode(episode.key, { synopsis: e.target.value })}
                              rows={3}
                              required
                            />
                          </div>
                          <div className={adminStyles.row2}>
                            <div className={adminStyles.field}>
                              <label>Année</label>
                              <input
                                value={episode.year || ""}
                                onChange={(e) => updateEpisode(episode.key, { year: Number(e.target.value) })}
                                type="number"
                                required
                              />
                            </div>
                            <div className={adminStyles.field}>
                              <label>Durée (minutes)</label>
                              <input
                                value={episode.durationMinutes || ""}
                                onChange={(e) =>
                                  updateEpisode(episode.key, { durationMinutes: Number(e.target.value) })
                                }
                                type="number"
                                min={1}
                                required
                              />
                              {episode.videoDurationSeconds !== null &&
                                episode.durationMinutes === minutesFromSeconds(episode.videoDurationSeconds) && (
                                  <span className={styles.formHint}>Calculée depuis la vidéo.</span>
                                )}
                            </div>
                          </div>
                          <div className={adminStyles.field}>
                            <label>Affiche</label>
                            <FileUpload
                              allowUrl
                              name={`episode-${episode.key}-poster`}
                              label="Choisir une image"
                              accept="image/*"
                              value={episode.poster}
                              onChange={(url) => updateEpisode(episode.key, { poster: url })}
                              preview
                            />
                          </div>
                          <div className={adminStyles.field}>
                            <label>Vidéo</label>
                            <FileUpload
                              allowUrl
                              name={`episode-${episode.key}-video`}
                              label="Choisir une vidéo"
                              accept="video/*"
                              value={episode.videoUrl}
                              onChange={(url) =>
                                updateEpisode(episode.key, { videoUrl: url, videoDurationSeconds: null })
                              }
                              onDurationChange={(seconds) =>
                                updateEpisode(episode.key, {
                                  videoDurationSeconds: Math.round(seconds),
                                  durationMinutes: minutesFromSeconds(seconds),
                                })
                              }
                              maxSizeMB={100}
                            />
                          </div>
                          <div className={adminStyles.field}>
                            <label>Diffusion</label>
                            <ReleaseFields
                              namePrefix={`episode-${episode.key}`}
                              value={episode.release}
                              onChange={(patch) => updateRelease(episode.key, patch)}
                            />
                          </div>
                          {episodes.length > 1 && (
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => removeEpisode(episode.key)}
                            >
                              Retirer cet épisode
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button type="button" className={styles.addEpisodeBtn} onClick={addEpisode}>
                + Ajouter un épisode
              </button>
            </FormSection>
          )}

          <label className={adminStyles.customCheckbox}>
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
            <span className={adminStyles.checkboxBox} />
            Afficher le badge « Nouveau » (7 jours)
          </label>

          <button
            type="button"
            className={adminStyles.submitBtn}
            disabled={isPending || !seriesReady}
            onClick={handleSubmitSeries}
          >
            {isPending
              ? "Enregistrement…"
              : mode === "announce"
                ? "Publier l'annonce"
                : `Publier la série (${episodes.length} épisode${episodes.length > 1 ? "s" : ""})`}
          </button>
        </>
      )}
    </div>
  );
}

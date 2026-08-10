"use client";

import { useState, useTransition } from "react";
import Dropdown from "@/components/Dropdown/Dropdown";
import FileUpload from "@/components/FileUpload/FileUpload";
import FilmForm from "./FilmForm";
import { createFilmAction, createSeriesAction, type SeriesEpisodeInput } from "./actions";
import type { Artist } from "@/data/types";
import { RATING_OPTIONS } from "@/lib/ratings";
import adminStyles from "../shared.module.css";
import styles from "./films.module.css";

const SEASON_TYPE_OPTIONS = ["Teaser", "Saison 1", "Saison 2", "Saison 3", "Saison 4", "Saison 5", "Saison 6"];

function seasonTypeLabel(episodeKind: "episode" | "teaser", seasonNumber: number): string {
  return episodeKind === "teaser" ? "Teaser" : `Saison ${seasonNumber}`;
}

const emptyEpisode = (previous?: SeriesEpisodeInput): SeriesEpisodeInput => ({
  title: "",
  synopsis: "",
  year: previous?.year ?? new Date().getFullYear(),
  durationMinutes: 0,
  episodeKind: previous?.episodeKind ?? "episode",
  seasonNumber: previous?.seasonNumber ?? 1,
  episodeNumber: previous ? previous.episodeNumber + 1 : 1,
  poster: "",
  videoUrl: "",
});

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
  const [contentType, setContentType] = useState("Film");
  const [rating, setRating] = useState(RATING_OPTIONS[0]);
  const [category, setCategory] = useState(categories[0]);
  const [artistId, setArtistId] = useState(artists[0]?.id ?? "");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [episodes, setEpisodes] = useState<SeriesEpisodeInput[]>([emptyEpisode()]);
  const [isPending, startTransition] = useTransition();

  const artistNames = artists.map((a) => (a.isStudio ? `${a.name} (studio)` : a.name));
  const selectedArtist = artists.find((a) => a.id === artistId);
  const selectedArtistName = selectedArtist
    ? selectedArtist.isStudio
      ? `${selectedArtist.name} (studio)`
      : selectedArtist.name
    : artistNames[0];

  const updateEpisode = (index: number, patch: Partial<SeriesEpisodeInput>) => {
    setEpisodes((prev) => prev.map((ep, i) => (i === index ? { ...ep, ...patch } : ep)));
  };
  const addEpisode = () => setEpisodes((prev) => [...prev, emptyEpisode(prev[prev.length - 1])]);
  const removeEpisode = (index: number) => setEpisodes((prev) => prev.filter((_, i) => i !== index));

  const seriesReady =
    seriesTitle.trim() &&
    !!selectedArtist &&
    episodes.length > 0 &&
    episodes.every(
      (ep) =>
        ep.title.trim() &&
        ep.synopsis.trim() &&
        ep.year > 0 &&
        ep.durationMinutes > 0 &&
        (ep.episodeKind === "teaser" || ep.seasonNumber > 0) &&
        ep.episodeNumber > 0 &&
        ep.poster &&
        ep.videoUrl
    );

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
        episodes,
      });
      onDone();
    });
  };

  return (
    <div className={adminStyles.form}>
      <div className={adminStyles.field}>
        <label>Type de contenu</label>
        <Dropdown options={["Film", "Série"]} value={contentType} onChange={setContentType} />
      </div>

      {contentType === "Film" ? (
        <FilmForm
          artists={artists}
          categories={categories}
          pending={filmPending}
          onSubmit={(formData) =>
            startTransition(async () => {
              await createFilmAction(formData);
              onDone();
            })
          }
        />
      ) : (
        <>
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
            <label>Artiste</label>
            <Dropdown
              options={artistNames}
              value={selectedArtistName}
              onChange={(name) => {
                const found = artists.find((a) => (a.isStudio ? `${a.name} (studio)` : a.name) === name);
                if (found) setArtistId(found.id);
              }}
            />
          </div>

          <div className={styles.episodes}>
            {episodes.map((episode, index) => (
              <div key={index} className={styles.episodeCard}>
                <div className={styles.episodeCardHeader}>
                  <span className={styles.episodeCardLabel}>
                    {episode.episodeKind === "teaser"
                      ? `Teaser ${episode.episodeNumber || "?"}`
                      : `Saison ${episode.seasonNumber || "?"} · Épisode ${episode.episodeNumber || "?"}`}
                  </span>
                  {episodes.length > 1 && (
                    <button type="button" className={styles.removeBtn} onClick={() => removeEpisode(index)}>
                      Retirer
                    </button>
                  )}
                </div>
                <div className={adminStyles.row2}>
                  <div className={adminStyles.field}>
                    <label>Type</label>
                    <Dropdown
                      options={SEASON_TYPE_OPTIONS}
                      value={seasonTypeLabel(episode.episodeKind, episode.seasonNumber)}
                      onChange={(label) => {
                        if (label === "Teaser") {
                          updateEpisode(index, { episodeKind: "teaser" });
                        } else {
                          updateEpisode(index, {
                            episodeKind: "episode",
                            seasonNumber: Number(label.replace("Saison ", "")),
                          });
                        }
                      }}
                    />
                  </div>
                  <div className={adminStyles.field}>
                    <label>Numéro</label>
                    <input
                      value={episode.episodeNumber || ""}
                      onChange={(e) => updateEpisode(index, { episodeNumber: Number(e.target.value) })}
                      type="number"
                      min={1}
                      required
                    />
                  </div>
                </div>
                <div className={adminStyles.field}>
                  <label>Titre de l&apos;épisode</label>
                  <input value={episode.title} onChange={(e) => updateEpisode(index, { title: e.target.value })} required />
                </div>
                <div className={adminStyles.field}>
                  <label>Synopsis</label>
                  <textarea
                    value={episode.synopsis}
                    onChange={(e) => updateEpisode(index, { synopsis: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className={adminStyles.row2}>
                  <div className={adminStyles.field}>
                    <label>Année</label>
                    <input
                      value={episode.year || ""}
                      onChange={(e) => updateEpisode(index, { year: Number(e.target.value) })}
                      type="number"
                      required
                    />
                  </div>
                  <div className={adminStyles.field}>
                    <label>Durée (minutes)</label>
                    <input
                      value={episode.durationMinutes || ""}
                      onChange={(e) => updateEpisode(index, { durationMinutes: Number(e.target.value) })}
                      type="number"
                      min={1}
                      required
                    />
                  </div>
                </div>
                <div className={adminStyles.field}>
                  <label>Poster</label>
                  <FileUpload
                    name={`episode-${index}-poster`}
                    label="Choisir une image"
                    accept="image/*"
                    value={episode.poster}
                    onChange={(url) => updateEpisode(index, { poster: url })}
                    preview
                  />
                </div>
                <div className={adminStyles.field}>
                  <label>Vidéo</label>
                  <FileUpload
                    name={`episode-${index}-video`}
                    label="Choisir une vidéo"
                    accept="video/*"
                    value={episode.videoUrl}
                    onChange={(url) => updateEpisode(index, { videoUrl: url })}
                    maxSizeMB={100}
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={styles.addEpisodeBtn} onClick={addEpisode}>
            + Ajouter un épisode
          </button>

          <label className={adminStyles.customCheckbox}>
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
            <span className={adminStyles.checkboxBox} />
            Marquer comme nouveauté (visible 7 jours)
          </label>

          <button
            type="button"
            className={adminStyles.submitBtn}
            disabled={isPending || !seriesReady}
            onClick={handleSubmitSeries}
          >
            {isPending
              ? "Enregistrement…"
              : `Publier la série (${episodes.length} épisode${episodes.length > 1 ? "s" : ""})`}
          </button>
        </>
      )}
    </div>
  );
}

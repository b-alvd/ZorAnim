export type PremiereStatus = "locked" | "preview" | "released";

type PremiereFilm = {
  premiereAt: string | null;
  releaseAt: string | null;
  durationMinutes: number;
  videoDurationSeconds: number | null;
};

// The admin-entered `durationMinutes` field is just display metadata and can
// be wrong or a placeholder; the real video file length (captured from
// Cloudinary at upload time) is what actually determines how long the live
// window lasts, when we have it.
function liveSeconds(film: PremiereFilm): number {
  return film.videoDurationSeconds ?? film.durationMinutes * 60;
}

function premiereEndsAt(film: PremiereFilm): number | null {
  if (!film.premiereAt) return null;
  return new Date(film.premiereAt).getTime() + liveSeconds(film) * 1000;
}

// The premiere airs once, live, for the duration of the film -- it is not a
// window you can drop into whenever. Before premiereAt: locked. From
// premiereAt to premiereAt+duration: playable ("preview"). After that, it
// locks again until releaseAt (the official release), same as before the
// premiere ever happened.
export function getPremiereStatus(film: PremiereFilm): PremiereStatus {
  if (!film.premiereAt) return "released";
  const now = Date.now();
  const start = new Date(film.premiereAt).getTime();
  if (now < start) return "locked";
  const end = premiereEndsAt(film)!;
  if (now < end) return "preview";
  if (film.releaseAt && new Date(film.releaseAt).getTime() > now) return "locked";
  return "released";
}

// When a locked film unlocks next: premiereAt if it hasn't aired yet,
// releaseAt if the live airing already happened. Null if not locked, or
// locked with no releaseAt set (shouldn't normally be shown as a countdown).
export function getPremiereUnlockAt(film: PremiereFilm): string | null {
  if (getPremiereStatus(film) !== "locked") return null;
  const now = Date.now();
  if (film.premiereAt && new Date(film.premiereAt).getTime() > now) return film.premiereAt;
  return film.releaseAt;
}

export function getPremiereBadge(film: PremiereFilm): string | null {
  const status = getPremiereStatus(film);
  if (status === "preview") return "Avant-première en direct";
  if (status === "locked") {
    const hasAired = film.premiereAt && new Date(film.premiereAt).getTime() <= Date.now();
    return hasAired ? "Bientôt disponible" : "Avant-première à venir";
  }
  return null;
}

export function getPremiereLiveClock(film: PremiereFilm): { elapsedSeconds: number; totalSeconds: number } | null {
  if (getPremiereStatus(film) !== "preview") return null;
  const start = new Date(film.premiereAt!).getTime();
  const totalSeconds = liveSeconds(film);
  const elapsedSeconds = Math.min(totalSeconds, Math.max(0, (Date.now() - start) / 1000));
  return { elapsedSeconds, totalSeconds };
}

export type FeaturedPremierePhase = "upcoming" | "live" | "waiting";

export function pickFeaturedPremiere<T extends PremiereFilm>(
  films: T[]
): { film: T; phase: FeaturedPremierePhase } | null {
  const live = films.filter((f) => getPremiereStatus(f) === "preview");
  if (live.length > 0) {
    live.sort((a, b) => new Date(a.premiereAt!).getTime() - new Date(b.premiereAt!).getTime());
    return { film: live[0], phase: "live" };
  }
  const locked = films.filter((f) => getPremiereStatus(f) === "locked" && getPremiereUnlockAt(f));
  if (locked.length > 0) {
    locked.sort((a, b) => new Date(getPremiereUnlockAt(a)!).getTime() - new Date(getPremiereUnlockAt(b)!).getTime());
    const film = locked[0];
    const hasAired = !!film.premiereAt && new Date(film.premiereAt).getTime() <= Date.now();
    return { film, phase: hasAired ? "waiting" : "upcoming" };
  }
  return null;
}

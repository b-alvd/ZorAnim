// Release asked for by a creator in a submission, which the admin can keep
// or change before accepting it. Stored as JSON in
// film_submissions.release_request (migration 0044).

// "announcement": no video yet; the fiche (poster, synopsis, trailers) goes
// to "Bientôt sur ZorAnim" until the content itself is proposed.
export type ReleaseRequestMode = "now" | "scheduled" | "premiere" | "announcement";

export type ReleaseTrailer = { title: string; videoUrl: string };

export type ReleaseRequest = {
  mode: ReleaseRequestMode;
  // ISO dates. "scheduled": releaseAt. "premiere": premiereAt, and optionally
  // releaseAt (official release after the live premiere).
  releaseAt: string | null;
  premiereAt: string | null;
  // Message from the creator to the team.
  note: string | null;
  // Trailers of an announcement.
  trailers?: ReleaseTrailer[];
  // Announcement fiche (film id) this content comes to fill: on acceptance
  // the fiche itself becomes the film (same page, trailers, "Ma liste").
  replacesId?: string | null;
  // Set by the admin only.
  premiereBanner?: string | null;
  releaseBanner?: string | null;
  premiereAdUrl?: string | null;
  premiereAdDurationSeconds?: number | null;
};

export const RELEASE_NOW: ReleaseRequest = { mode: "now", releaseAt: null, premiereAt: null, note: null };

function isoOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Reads a stored or submitted value; anything invalid falls back to "now".
export function parseReleaseRequest(raw: unknown): ReleaseRequest {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return RELEASE_NOW;
    }
  }
  if (!value || typeof value !== "object") return RELEASE_NOW;
  const v = value as Record<string, unknown>;
  const mode: ReleaseRequestMode =
    v.mode === "scheduled" || v.mode === "premiere" || v.mode === "announcement" ? v.mode : "now";
  const trailers = Array.isArray(v.trailers)
    ? v.trailers
        .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
        .map((t) => ({ title: textOrNull(t.title) ?? "Bande-annonce", videoUrl: textOrNull(t.videoUrl) ?? "" }))
        .filter((t) => t.videoUrl)
    : [];
  const duration = Number(v.premiereAdDurationSeconds);
  return {
    mode,
    releaseAt: mode === "scheduled" || mode === "premiere" ? isoOrNull(v.releaseAt) : null,
    premiereAt: mode === "premiere" ? isoOrNull(v.premiereAt) : null,
    note: textOrNull(v.note),
    trailers: mode === "announcement" ? trailers : [],
    replacesId: mode === "announcement" ? null : textOrNull(v.replacesId),
    premiereBanner: mode === "premiere" ? textOrNull(v.premiereBanner) : null,
    releaseBanner: mode === "premiere" ? textOrNull(v.releaseBanner) : null,
    premiereAdUrl: mode === "premiere" ? textOrNull(v.premiereAdUrl) : null,
    premiereAdDurationSeconds:
      mode === "premiere" && Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
  };
}

// Error message when the dates don't fit the chosen mode, null when fine.
export function validateReleaseRequest(r: ReleaseRequest, now: number): string | null {
  if (r.mode === "scheduled") {
    if (!r.releaseAt) return "Choisis la date de sortie.";
    if (new Date(r.releaseAt).getTime() <= now) return "La date de sortie doit être dans le futur.";
  }
  if (r.mode === "premiere") {
    if (!r.premiereAt) return "Choisis la date de l'avant-première.";
    if (new Date(r.premiereAt).getTime() <= now) return "L'avant-première doit être dans le futur.";
    if (r.releaseAt && new Date(r.releaseAt).getTime() <= new Date(r.premiereAt).getTime()) {
      return "La sortie officielle doit venir après l'avant-première.";
    }
  }
  return null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  return `${day} à ${time}`;
}

// Short French description, e.g. "Avant-première le samedi 12 décembre à 20:00".
export function describeReleaseRequest(r: ReleaseRequest): string {
  if (r.mode === "scheduled" && r.releaseAt) return `Sortie le ${formatDate(r.releaseAt)}`;
  if (r.mode === "premiere" && r.premiereAt) {
    const premiere = `Avant-première le ${formatDate(r.premiereAt)}`;
    return r.releaseAt ? `${premiere}, sortie le ${formatDate(r.releaseAt)}` : premiere;
  }
  if (r.mode === "announcement") {
    const count = r.trailers?.length ?? 0;
    return count > 0 ? `Annonce avec ${count} bande${count > 1 ? "s" : ""}-annonce${count > 1 ? "s" : ""}` : "Annonce";
  }
  return "Dès l'acceptation";
}

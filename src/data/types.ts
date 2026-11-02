export type Artist = {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  isStudio: boolean;
};

export type Trailer = { id: string; title: string; videoUrl: string };

export type Film = {
  id: string;
  title: string;
  synopsis: string;
  year: number;
  duration: string;
  durationMinutes: number;
  rating: string;
  category: string;
  artistId: string;
  artistName: string;
  isStudioAttribution: boolean;
  isNew: boolean;
  poster: string;
  videoUrl: string;
  // Content-level rating: the film's own, or for an episode the series'
  // average (each user's mean over the episodes they rated, then averaged).
  avgRating: number | null;
  ratingCount: number;
  // The episode's own rating (same as avgRating for a standalone film).
  episodeAvgRating: number | null;
  episodeRatingCount: number;
  seriesTitle: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  episodeKind: "episode" | "teaser";
  teaserVideoUrl: string | null;
  // Trailers to show: the series' for an episode, the film's own otherwise.
  trailers: Trailer[];
  premiereAt: string | null;
  premiereBanner: string | null;
  releaseBanner: string | null;
  premiereAdUrl: string | null;
  premiereAdDurationSeconds: number | null;
  releaseAt: string | null;
  videoDurationSeconds: number | null;
};

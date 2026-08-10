export type Artist = {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  isStudio: boolean;
};

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
  avgRating: number | null;
  ratingCount: number;
  seriesTitle: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  episodeKind: "episode" | "teaser";
  teaserVideoUrl: string | null;
};

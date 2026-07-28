export type Artist = {
  id: string;
  name: string;
  bio: string;
  avatar: string;
};

export type Film = {
  id: string;
  title: string;
  synopsis: string;
  year: number;
  duration: string;
  rating: string;
  category: string;
  artistId: string;
  artistName: string;
  isNew: boolean;
  poster: string;
  videoUrl: string;
};

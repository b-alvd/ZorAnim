"use client";

import Card from "@/components/Card/Card";
import type { Film } from "@/data/types";
import Shelf from "./Shelf";

// A shelf of content cards.
export default function Row({
  title,
  subtitle,
  films,
  favoriteIds,
  watchedIds,
  comingSoon = false,
  href,
}: {
  title: string;
  subtitle?: string;
  films: (Film & { episodeCount?: number })[];
  favoriteIds?: string[];
  watchedIds?: string[];
  comingSoon?: boolean;
  // "Tout voir" link shown next to the title.
  href?: string;
}) {
  const favoriteSet = new Set(favoriteIds);
  const watchedSet = new Set(watchedIds);
  if (films.length === 0) return null;

  return (
    <Shelf title={title} subtitle={subtitle} href={href}>
      {films.map((f) => (
        <Card
          key={f.id}
          film={f}
          isFavorite={favoriteSet.has(f.id)}
          isWatched={watchedSet.has(f.id)}
          episodeCount={f.episodeCount}
          comingSoon={comingSoon}
        />
      ))}
    </Shelf>
  );
}

import { redirect } from "next/navigation";
import { getFavoriteDates, getFilms, getWatchEntries } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries, splitComingSoon } from "@/lib/series";
import { contentDuration, getContinueItems, getSeriesProgress } from "@/lib/progress";
import { MIN_RESUME_SECONDS } from "@/lib/watch-progress";
import MyList, { type ListItem } from "./MyList";

export default async function MaListePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const [allFilms, favoriteDates, entries] = await Promise.all([
    getFilms(),
    getFavoriteDates(user.id),
    getWatchEntries(user.id),
  ]);
  const watchedAt = new Map([...entries].map(([id, e]) => [id, e.at]));

  // A series is in the list when any of its episodes (or its fiche) was added.
  const favoriteSeries = new Map<string, string>();
  for (const f of allFilms) {
    const at = favoriteDates.get(f.id);
    if (!f.seriesTitle || !at) continue;
    if (at > (favoriteSeries.get(f.seriesTitle) ?? "")) favoriteSeries.set(f.seriesTitle, at);
  }
  const inList = allFilms.filter((f) => favoriteDates.has(f.id) || (!!f.seriesTitle && favoriteSeries.has(f.seriesTitle)));

  const { released, comingSoon } = splitComingSoon(allFilms);
  const releasedIds = new Set(released.map((f) => f.id));
  const comingSoonSeries = new Set(comingSoon.filter((f) => f.seriesTitle).map((f) => f.seriesTitle));
  const progress = getSeriesProgress(released, watchedAt);
  const continueBy = new Map(getContinueItems(released, entries, MIN_RESUME_SECONDS).map((i) => [i.key, i]));

  const items: ListItem[] = collapseSeries(inList).map((f) => {
    const addedAt = (f.seriesTitle ? favoriteSeries.get(f.seriesTitle) : favoriteDates.get(f.id)) ?? "";
    const upcoming = f.seriesTitle
      ? comingSoonSeries.has(f.seriesTitle) && !progress.has(f.seriesTitle)
      : !releasedIds.has(f.id);
    if (upcoming) return { film: f, addedAt, status: "upcoming", watched: 0, total: 0, nextId: null };
    const item = continueBy.get(f.seriesTitle ?? f.id);

    // Film: the bar shows the playback position.
    if (!f.seriesTitle) {
      if (item) return { film: f, addedAt, status: "started", watched: item.position, total: contentDuration(f), nextId: f.id };
      return { film: f, addedAt, status: watchedAt.has(f.id) ? "seen" : "todo", watched: 0, total: 1, nextId: f.id };
    }

    // Series: the bar shows the episodes watched; "Continuer" plays what
    // "Reprendre" offers (resume point or next episode).
    const p = progress.get(f.seriesTitle)!;
    const status = p.watched === 0 ? "todo" : item || p.next ? "started" : "seen";
    return { film: f, addedAt, status, watched: p.watched, total: p.total, nextId: item?.film.id ?? p.next?.id ?? null };
  });

  return <MyList items={items} />;
}

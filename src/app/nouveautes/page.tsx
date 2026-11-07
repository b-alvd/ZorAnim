import RefreshOnReturn from "@/components/RefreshOnReturn/RefreshOnReturn";
import Link from "next/link";
import Card from "@/components/Card/Card";
import { Captioned } from "@/components/Card/ExtraCards";
import GuestBanner from "@/components/GuestBanner/GuestBanner";
import { getFavoriteFilmIds, getFilmAddedDates, getFilms, getWatchActivity } from "@/db/queries";
import type { Film } from "@/data/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries, isAnnouncement, splitComingSoon } from "@/lib/series";
import { describeNew, formatAgo, groupByAge, sortByAdded } from "@/lib/recent";
import { getSeriesProgress } from "@/lib/progress";
import Spotlight from "./Spotlight";
import styles from "./nouveautes.module.css";

// How many recent contents the page lists before pointing to the catalogue.
const RECENT_LIMIT = 24;

function formatDay(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} à ${time}`;
}

// Label of an upcoming card: what is planned and when.
function describeUpcoming(f: Film, now: number): { kicker: string; detail: string } {
  if (isAnnouncement(f)) return { kicker: "Annoncé", detail: "Date de sortie à venir" };
  if (f.premiereAt && new Date(f.premiereAt).getTime() > now) {
    return { kicker: "Avant-première", detail: formatDay(f.premiereAt) };
  }
  if (f.releaseAt) return { kicker: "Sortie", detail: formatDay(f.releaseAt) };
  return { kicker: "Bientôt", detail: "Date de sortie à venir" };
}

async function loadNouveautes(userId: string | null) {
  const [allFilms, dates, favoriteIds, watchedAt] = await Promise.all([
    getFilms(),
    getFilmAddedDates(),
    userId ? getFavoriteFilmIds(userId) : Promise.resolve(new Set<string>()),
    userId ? getWatchActivity(userId) : Promise.resolve(new Map<string, string>()),
  ]);
  const now = Date.now();
  const { released, comingSoon } = splitComingSoon(allFilms);
  const recent = sortByAdded(collapseSeries(released), released, dates).slice(0, RECENT_LIMIT);
  const progress = getSeriesProgress(released, watchedAt);
  const isWatched = (f: Film) => {
    if (!f.seriesTitle) return watchedAt.has(f.id);
    const p = progress.get(f.seriesTitle);
    return !!p && p.total > 0 && p.watched === p.total;
  };

  // Soonest first; announcements without a date at the end.
  const upcoming = collapseSeries(comingSoon)
    .map((f) => ({ film: f, label: describeUpcoming(f, now), at: f.premiereAt ?? f.releaseAt ?? "9999" }))
    .sort((a, b) => a.at.localeCompare(b.at));

  const [first, ...rest] = recent;
  return {
    spotlight: first ? { film: first, kicker: describeNew(first), when: formatAgo(first.addedAt, now) } : null,
    groups: groupByAge(rest, now).map((g) => ({
      title: g.title,
      items: g.films.map((f) => ({ film: f, kicker: describeNew(f), when: formatAgo(f.addedAt, now) })),
    })),
    upcoming,
    favoriteIds,
    isWatched,
  };
}

export default async function NouveautesPage() {
  const user = await getCurrentUser();
  const { spotlight, groups, upcoming, favoriteIds, isWatched } = await loadNouveautes(user?.id ?? null);

  return (
    <main className={styles.page}>
      <RefreshOnReturn />
      {!user && <GuestBanner />}
      <div className={styles.header}>
        <h1 className={styles.title}>Nouveautés</h1>
        <p className={styles.subtitle}>Les derniers films et épisodes arrivés sur ZorAnim, et ce qui arrive bientôt.</p>
      </div>

      {spotlight && (
        <Spotlight
          film={spotlight.film}
          playId={spotlight.film.latest.id}
          kicker={spotlight.kicker}
          when={spotlight.when}
          isFavorite={favoriteIds.has(spotlight.film.id)}
        />
      )}

      {upcoming.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Bientôt sur ZorAnim</h2>
            <span className={styles.sectionCount}>{upcoming.length}</span>
          </div>
          <div className={styles.grid}>
            {upcoming.map(({ film, label }) => (
              <Captioned key={film.id} kicker={label.kicker} detail={label.detail}>
                <Card film={film} episodeCount={film.episodeCount} comingSoon />
              </Captioned>
            ))}
          </div>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.title} className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{g.title}</h2>
            <span className={styles.sectionCount}>{g.items.length}</span>
          </div>
          <div className={styles.grid}>
            {g.items.map(({ film, kicker, when }) => (
              <Captioned key={film.id} kicker={kicker} detail={when}>
                <Card
                  film={film}
                  isFavorite={favoriteIds.has(film.id)}
                  isWatched={isWatched(film)}
                  episodeCount={film.episodeCount}
                />
              </Captioned>
            ))}
          </div>
        </section>
      ))}

      {!spotlight && upcoming.length === 0 ? (
        <p className={styles.empty}>Rien de nouveau pour l&apos;instant. Reviens bientôt !</p>
      ) : (
        <div className={styles.footer}>
          <p>Tu as tout vu ?</p>
          <Link href="/catalogue" className={styles.footerLink}>
            Explorer tout le catalogue
          </Link>
        </div>
      )}
    </main>
  );
}

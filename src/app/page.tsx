import Hero from "@/components/Hero/Hero";
import Row from "@/components/Row/Row";
import Landing from "@/components/Landing/Landing";
import PatchNoteBubble from "@/components/PatchNoteBubble/PatchNoteBubble";
import PremiereBanner from "@/components/PremiereBanner/PremiereBanner";
import { getFavoriteFilmIds, getFilms, getSeriesEpisodeIds, getSiteSettings, getWatchedFilmIds } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { collapseSeries, computeEffectiveWatchedIds, splitComingSoon } from "@/lib/series";
import styles from "./home.module.css";

export default async function Home() {
  const [user, allFilms, settings] = await Promise.all([getCurrentUser(), getFilms(), getSiteSettings()]);
  const { released: films, comingSoon: comingSoonFilms } = splitComingSoon(allFilms);
  const showPatchNote = settings.patchNoteEnabled && !!settings.patchNoteMessage?.trim();

  if (!user) return <Landing films={allFilms} patchNote={showPatchNote ? settings : null} />;

  if (films.length === 0) {
    return (
      <main className={styles.empty}>
        <p className={styles.emptyText}>Aucun film ou série disponible pour l&apos;instant. Reviens bientôt !</p>
      </main>
    );
  }

  const [favoriteIds, watchedIds] = await Promise.all([getFavoriteFilmIds(user.id), getWatchedFilmIds(user.id)]);
  const collapsedFilms = collapseSeries(films);
  const collapsedComingSoon = collapseSeries(comingSoonFilms);
  const collapsedNewFilms = collapseSeries(films.filter((f) => f.isNew));
  const categories = [...new Set(films.map((f) => f.category))];
  const seriesTitles = [...new Set(collapsedFilms.filter((f) => f.seriesTitle).map((f) => f.seriesTitle!))];
  const episodeIdsMap = await getSeriesEpisodeIds(seriesTitles);
  const effectiveWatchedIds = computeEffectiveWatchedIds(collapsedFilms, watchedIds, episodeIdsMap);
  const favoriteIdsArr = [...favoriteIds];
  const watchedIdsArr = [...effectiveWatchedIds];

  return (
    <main>
      <Hero films={collapsedFilms} />
      <PremiereBanner films={allFilms} />
      {showPatchNote && (
        <PatchNoteBubble title={settings.patchNoteTitle} message={settings.patchNoteMessage!} />
      )}
      {collapsedComingSoon.length > 0 && <Row title="Bientôt sur ZorAnim" films={collapsedComingSoon} comingSoon />}
      {collapsedNewFilms.length > 0 && (
        <Row title="Nouveautés" films={collapsedNewFilms} favoriteIds={favoriteIdsArr} watchedIds={watchedIdsArr} />
      )}
      {categories.map((cat) => (
        <Row
          key={cat}
          title={cat}
          films={collapseSeries(films.filter((f) => f.category === cat))}
          favoriteIds={favoriteIdsArr}
          watchedIds={watchedIdsArr}
        />
      ))}
    </main>
  );
}

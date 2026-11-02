// Data migration: turn the old "teaser episodes" of series into the new
// series-level trailer (series_info, migration 0035).
//
// For each series that has teaser episodes:
//   - the latest teaser (highest number) becomes the series trailer, unless
//     the series already has one;
//   - if the series also has real episodes, its teaser episodes are removed:
//     favorites on them move to the series' first episode, their watch
//     history goes with them. A teaser that still carries ratings or
//     comments is kept and reported, never deleted;
//   - a series made only of teasers keeps them (that is what puts it in
//     "Bientôt sur ZorAnim"): it just gets its trailer set as well.
//
// Dry run by default. Add --apply to write:
//   npx tsx --env-file=.env.local scripts/migrate-0036-teasers-to-trailers.ts
//   npx tsx --env-file=.env.local scripts/migrate-0036-teasers-to-trailers.ts --apply
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const apply = process.argv.includes("--apply");

type Episode = {
  id: string;
  title: string;
  series_title: string;
  episode_kind: string;
  season_number: number | null;
  episode_number: number | null;
  video_url: string;
};

async function main() {
  console.log(apply ? "MODE : application des changements\n" : "MODE : simulation (rien n'est écrit, ajoute --apply)\n");

  const episodes = await db.all<Episode>(sql`
    SELECT id, title, series_title, episode_kind, season_number, episode_number, video_url
    FROM films WHERE series_title IS NOT NULL
  `);
  const existingTrailers = new Map(
    (await db.all<{ series_title: string; trailer_url: string | null }>(sql`SELECT series_title, trailer_url FROM series_info`)).map(
      (r) => [r.series_title, r.trailer_url]
    )
  );

  const bySeries = new Map<string, Episode[]>();
  for (const ep of episodes) bySeries.set(ep.series_title, [...(bySeries.get(ep.series_title) ?? []), ep]);

  for (const [title, list] of bySeries) {
    const teasers = list
      .filter((e) => e.episode_kind === "teaser")
      .sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0));
    if (teasers.length === 0) continue;
    const real = list
      .filter((e) => e.episode_kind !== "teaser")
      .sort((a, b) => (a.season_number ?? 0) - (b.season_number ?? 0) || (a.episode_number ?? 0) - (b.episode_number ?? 0));

    console.log(`« ${title} » : ${teasers.length} teaser(s), ${real.length} épisode(s)`);

    const latest = teasers[teasers.length - 1];
    if (existingTrailers.get(title)) {
      console.log(`  - bande-annonce déjà définie, inchangée`);
    } else {
      console.log(`  - bande-annonce de la série ← « ${latest.title} »`);
      if (apply) {
        await db.run(sql`
          INSERT INTO series_info (series_title, trailer_url) VALUES (${title}, ${latest.video_url})
          ON CONFLICT(series_title) DO UPDATE SET trailer_url = excluded.trailer_url, updated_at = current_timestamp
        `);
      }
    }

    if (real.length === 0) {
      console.log(`  - aucun vrai épisode : les teasers sont gardés (la série reste dans « Bientôt »)`);
      continue;
    }

    const first = real[0];
    for (const teaser of teasers) {
      const [{ n: ratings }] = await db.all<{ n: number }>(sql`SELECT count(*) AS n FROM film_ratings WHERE film_id = ${teaser.id}`);
      const [{ n: comments }] = await db.all<{ n: number }>(sql`SELECT count(*) AS n FROM comments WHERE film_id = ${teaser.id}`);
      if (ratings > 0 || comments > 0) {
        console.log(`  - « ${teaser.title} » GARDÉ : ${ratings} note(s), ${comments} commentaire(s) dessus`);
        continue;
      }
      const favs = await db.all<{ user_id: string }>(sql`SELECT user_id FROM favorites WHERE film_id = ${teaser.id}`);
      const [{ n: watches }] = await db.all<{ n: number }>(sql`SELECT count(*) AS n FROM watch_history WHERE film_id = ${teaser.id}`);
      console.log(
        `  - « ${teaser.title} » supprimé (${favs.length} favori(s) déplacé(s) vers « ${first.title} », ${watches} historique(s) de visionnage retiré(s))`
      );
      // The video file itself stays on the CDN: print it so it can be reused.
      console.log(`      vidéo : ${teaser.video_url}`);
      if (apply) {
        for (const f of favs) {
          await db.run(sql`
            INSERT OR IGNORE INTO favorites (id, user_id, film_id) VALUES (${randomUUID()}, ${f.user_id}, ${first.id})
          `);
        }
        // Explicit, rather than relying on ON DELETE CASCADE being enforced.
        await db.run(sql`DELETE FROM favorites WHERE film_id = ${teaser.id}`);
        await db.run(sql`DELETE FROM watch_history WHERE film_id = ${teaser.id}`);
        await db.run(sql`DELETE FROM premiere_viewers WHERE film_id = ${teaser.id}`);
        await db.run(sql`DELETE FROM films WHERE id = ${teaser.id}`);
      }
    }
  }

  console.log(apply ? "\nTerminé." : "\nSimulation terminée. Relance avec --apply pour appliquer.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

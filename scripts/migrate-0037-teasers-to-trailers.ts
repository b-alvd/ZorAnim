// Data migration: move existing trailers into the trailers table (created by
// scripts/apply-0036.ts), so old content uses the new "bandes-annonces".
//
// Series with teaser episodes:
//   - every teaser episode becomes a trailer of the series, in their order,
//     keeping its title (unless the series already has trailers);
//   - if the series also has real episodes, its teaser episodes are removed:
//     favorites on them move to the series' first episode, their watch
//     history goes with them. A teaser that still carries ratings or
//     comments is kept and reported, never deleted;
//   - a series made only of teasers keeps them (that is what puts it in
//     "Bientôt sur ZorAnim"): it just gets its trailers as well.
// Films with the legacy single trailer field (teaser_video_url):
//   - it becomes the film's first trailer and the legacy field is cleared.
//
// Dry run by default. Add --apply to write:
//   npx tsx --env-file=.env.local scripts/migrate-0037-teasers-to-trailers.ts
//   npx tsx --env-file=.env.local scripts/migrate-0037-teasers-to-trailers.ts --apply
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const apply = process.argv.includes("--apply");

type Row = {
  id: string;
  title: string;
  series_title: string | null;
  episode_kind: string;
  season_number: number | null;
  episode_number: number | null;
  video_url: string;
  teaser_video_url: string | null;
};

async function count(query: ReturnType<typeof sql>): Promise<number> {
  const [{ n }] = await db.all<{ n: number }>(query);
  return n;
}

async function main() {
  console.log(apply ? "MODE : application des changements\n" : "MODE : simulation (rien n'est écrit, ajoute --apply)\n");

  try {
    await db.all(sql`SELECT 1 FROM trailers LIMIT 1`);
  } catch {
    throw new Error("La table trailers n'existe pas : lance d'abord scripts/apply-0036.ts.");
  }

  const rows = await db.all<Row>(sql`
    SELECT id, title, series_title, episode_kind, season_number, episode_number, video_url, teaser_video_url FROM films
  `);
  const seriesWithTrailers = new Set(
    (await db.all<{ series_title: string }>(sql`SELECT DISTINCT series_title FROM trailers WHERE series_title IS NOT NULL`)).map(
      (r) => r.series_title
    )
  );
  const filmsWithTrailers = new Set(
    (await db.all<{ film_id: string }>(sql`SELECT DISTINCT film_id FROM trailers WHERE film_id IS NOT NULL`)).map((r) => r.film_id)
  );

  const addTrailer = async (owner: { seriesTitle?: string; filmId?: string }, title: string, videoUrl: string, position: number) => {
    if (!apply) return;
    await db.run(sql`
      INSERT INTO trailers (id, series_title, film_id, title, video_url, position)
      VALUES (${randomUUID()}, ${owner.seriesTitle ?? null}, ${owner.filmId ?? null}, ${title}, ${videoUrl}, ${position})
    `);
  };

  // ---------- Series ----------
  const bySeries = new Map<string, Row[]>();
  for (const r of rows) if (r.series_title) bySeries.set(r.series_title, [...(bySeries.get(r.series_title) ?? []), r]);

  for (const [title, list] of bySeries) {
    const teasers = list
      .filter((e) => e.episode_kind === "teaser")
      .sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0));
    if (teasers.length === 0) continue;
    const real = list
      .filter((e) => e.episode_kind !== "teaser")
      .sort((a, b) => (a.season_number ?? 0) - (b.season_number ?? 0) || (a.episode_number ?? 0) - (b.episode_number ?? 0));

    console.log(`Série « ${title} » : ${teasers.length} teaser(s), ${real.length} épisode(s)`);

    if (seriesWithTrailers.has(title)) {
      console.log(`  - bandes-annonces déjà présentes, inchangées`);
    } else {
      for (const [position, teaser] of teasers.entries()) {
        console.log(`  - bande-annonce ${position + 1} ← « ${teaser.title} »`);
        await addTrailer({ seriesTitle: title }, teaser.title, teaser.video_url, position);
      }
    }

    if (real.length === 0) {
      console.log(`  - aucun vrai épisode : les teasers sont gardés (la série reste dans « Bientôt »)`);
      continue;
    }

    const first = real[0];
    for (const teaser of teasers) {
      const ratings = await count(sql`SELECT count(*) AS n FROM film_ratings WHERE film_id = ${teaser.id}`);
      const comments = await count(sql`SELECT count(*) AS n FROM comments WHERE film_id = ${teaser.id}`);
      if (ratings > 0 || comments > 0) {
        console.log(`  - épisode « ${teaser.title} » GARDÉ : ${ratings} note(s), ${comments} commentaire(s) dessus`);
        continue;
      }
      const favs = await db.all<{ user_id: string }>(sql`SELECT user_id FROM favorites WHERE film_id = ${teaser.id}`);
      const watches = await count(sql`SELECT count(*) AS n FROM watch_history WHERE film_id = ${teaser.id}`);
      console.log(
        `  - épisode « ${teaser.title} » retiré de la liste (${favs.length} favori(s) déplacé(s) vers « ${first.title} », ${watches} historique(s) de visionnage retiré(s))`
      );
      if (apply) {
        for (const f of favs) {
          await db.run(sql`INSERT OR IGNORE INTO favorites (id, user_id, film_id) VALUES (${randomUUID()}, ${f.user_id}, ${first.id})`);
        }
        // Explicit, rather than relying on ON DELETE CASCADE being enforced.
        await db.run(sql`DELETE FROM favorites WHERE film_id = ${teaser.id}`);
        await db.run(sql`DELETE FROM watch_history WHERE film_id = ${teaser.id}`);
        await db.run(sql`DELETE FROM premiere_viewers WHERE film_id = ${teaser.id}`);
        await db.run(sql`DELETE FROM films WHERE id = ${teaser.id}`);
      }
    }
  }

  // ---------- Films: legacy single trailer ----------
  for (const film of rows.filter((r) => !r.series_title && r.teaser_video_url)) {
    if (filmsWithTrailers.has(film.id)) continue;
    console.log(`Film « ${film.title} » : bande-annonce existante déplacée dans la liste`);
    await addTrailer({ filmId: film.id }, "Bande-annonce", film.teaser_video_url!, 0);
    if (apply) await db.run(sql`UPDATE films SET teaser_video_url = NULL WHERE id = ${film.id}`);
  }

  console.log(apply ? "\nTerminé." : "\nSimulation terminée. Relance avec --apply pour appliquer.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });

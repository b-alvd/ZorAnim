// Data migration: the "teaser episode" kind is gone. Existing teasers become
// trailers (bandes-annonces), and what only existed through a teaser becomes
// an announcement fiche ("Bientôt sur ZorAnim", trailers only).
//
// Series with teaser episodes:
//   - every teaser video becomes a trailer of the series (unless already one);
//   - if the series has real episodes, its teaser rows are removed: their
//     favorites, ratings and comments move to the first episode;
//   - otherwise the first teaser row is kept as the series' announcement
//     fiche (the other teasers are folded into it the same way).
// Films marked as teaser ("pas encore sorti"): they become announcement
// fiches, their teaser video moving to their trailers.
//
// Runs as a dry run by default. Add --apply to write. The trailers table
// (scripts/apply-0036.ts) must exist.
//   npx tsx --env-file=.env.local scripts/migrate-0038-remove-teaser-episodes.ts
//   npx tsx --env-file=.env.local scripts/migrate-0038-remove-teaser-episodes.ts --apply
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

const count = async (query: ReturnType<typeof sql>) => (await db.all<{ n: number }>(query))[0].n;

// Moves everything attached to a film row onto another one, then deletes it.
async function foldInto(fromId: string, toId: string) {
  await db.run(sql`
    INSERT OR IGNORE INTO favorites (id, user_id, film_id, created_at)
    SELECT lower(hex(randomblob(16))), user_id, ${toId}, created_at FROM favorites WHERE film_id = ${fromId}
  `);
  await db.run(sql`
    INSERT OR IGNORE INTO film_ratings (id, user_id, film_id, value, created_at)
    SELECT lower(hex(randomblob(16))), user_id, ${toId}, value, created_at FROM film_ratings WHERE film_id = ${fromId}
  `);
  await db.run(sql`UPDATE comments SET film_id = ${toId} WHERE film_id = ${fromId}`);
  // Explicit, rather than relying on ON DELETE CASCADE being enforced.
  for (const table of ["favorites", "film_ratings", "watch_history", "premiere_viewers"]) {
    await db.run(sql.raw(`DELETE FROM ${table} WHERE film_id = '${fromId.replace(/'/g, "''")}'`));
  }
  await db.run(sql`DELETE FROM films WHERE id = ${fromId}`);
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
  const trailerUrls = async (owner: { seriesTitle?: string; filmId?: string }) =>
    new Set(
      (
        await db.all<{ video_url: string }>(
          owner.seriesTitle
            ? sql`SELECT video_url FROM trailers WHERE series_title = ${owner.seriesTitle}`
            : sql`SELECT video_url FROM trailers WHERE film_id = ${owner.filmId!}`
        )
      ).map((r) => r.video_url)
    );
  const addTrailer = async (owner: { seriesTitle?: string; filmId?: string }, title: string, videoUrl: string) => {
    const existing = await trailerUrls(owner);
    if (existing.has(videoUrl)) return false;
    if (apply) {
      await db.run(sql`
        INSERT INTO trailers (id, series_title, film_id, title, video_url, position)
        VALUES (${randomUUID()}, ${owner.seriesTitle ?? null}, ${owner.filmId ?? null}, ${title}, ${videoUrl}, ${existing.size})
      `);
    }
    return true;
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
      .filter((e) => e.episode_kind === "episode")
      .sort((a, b) => (a.season_number ?? 0) - (b.season_number ?? 0) || (a.episode_number ?? 0) - (b.episode_number ?? 0));

    console.log(`Série « ${title} » : ${teasers.length} épisode(s) teaser, ${real.length} épisode(s)`);
    for (const t of teasers) {
      const added = await addTrailer({ seriesTitle: title }, t.title, t.video_url);
      console.log(`  - « ${t.title} » ${added ? "→ ajouté aux bandes-annonces" : ": déjà parmi les bandes-annonces"}`);
    }

    if (real.length > 0) {
      for (const t of teasers) {
        const n = await count(sql`SELECT
          (SELECT count(*) FROM favorites WHERE film_id = ${t.id}) +
          (SELECT count(*) FROM film_ratings WHERE film_id = ${t.id}) +
          (SELECT count(*) FROM comments WHERE film_id = ${t.id}) AS n`);
        console.log(`  - épisode teaser « ${t.title} » retiré (${n} favori(s)/note(s)/commentaire(s) déplacé(s) vers « ${real[0].title} »)`);
        if (apply) await foldInto(t.id, real[0].id);
      }
    } else {
      const [fiche, ...others] = teasers;
      console.log(`  - « ${fiche.title} » devient la fiche d'annonce (la série reste dans « Bientôt »)`);
      // The fiche stands for the series: it takes the series title.
      if (apply) {
        await db.run(sql`
          UPDATE films SET episode_kind = 'announcement', season_number = NULL, episode_number = NULL, title = ${title}
          WHERE id = ${fiche.id}
        `);
      }
      for (const t of others) {
        console.log(`  - épisode teaser « ${t.title} » fusionné dans la fiche`);
        if (apply) await foldInto(t.id, fiche.id);
      }
    }
  }

  // ---------- Films "pas encore sorti" ----------
  for (const film of rows.filter((r) => !r.series_title && r.episode_kind === "teaser")) {
    console.log(`Film « ${film.title} » : devient une annonce, sa vidéo teaser passe en bande-annonce`);
    await addTrailer({ filmId: film.id }, "Teaser", film.video_url);
    if (film.teaser_video_url) await addTrailer({ filmId: film.id }, "Bande-annonce", film.teaser_video_url);
    if (apply) {
      await db.run(sql`UPDATE films SET episode_kind = 'announcement', teaser_video_url = NULL WHERE id = ${film.id}`);
    }
  }

  console.log(apply ? "\nTerminé." : "\nSimulation terminée. Relance avec --apply pour appliquer.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });

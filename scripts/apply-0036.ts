import { db } from "@/db";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

// Trailers ("bandes-annonces"), several per film or per series. Replaces the
// short-lived series_info table (single trailer per series).
async function main() {
  await db.run(
    sql.raw(`CREATE TABLE IF NOT EXISTS trailers (
      id text PRIMARY KEY NOT NULL,
      series_title text,
      film_id text REFERENCES films(id) ON DELETE CASCADE,
      title text NOT NULL,
      video_url text NOT NULL,
      position integer DEFAULT 0 NOT NULL,
      created_at text DEFAULT (current_timestamp) NOT NULL
    )`)
  );
  await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS trailers_series_title_idx ON trailers (series_title)`));
  await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS trailers_film_id_idx ON trailers (film_id)`));
  console.log("trailers: ready");

  // series_info held at most one trailer per series: copy any into trailers,
  // then drop it.
  try {
    const old = await db.all<{ series_title: string; trailer_url: string }>(
      sql`SELECT series_title, trailer_url FROM series_info WHERE trailer_url IS NOT NULL`
    );
    for (const row of old) {
      const [{ n }] = await db.all<{ n: number }>(sql`SELECT count(*) AS n FROM trailers WHERE series_title = ${row.series_title}`);
      if (n > 0) continue;
      await db.run(sql`
        INSERT INTO trailers (id, series_title, title, video_url, position)
        VALUES (${randomUUID()}, ${row.series_title}, 'Bande-annonce', ${row.trailer_url}, 0)
      `);
    }
    await db.run(sql.raw(`DROP TABLE series_info`));
    console.log(`series_info: ${old.length} bande(s)-annonce(s) recopiée(s), table supprimée`);
  } catch {
    console.log("series_info: absente");
  }
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

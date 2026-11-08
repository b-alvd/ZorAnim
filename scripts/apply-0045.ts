import { db } from "@/db";
import { sql } from "drizzle-orm";

// Portfolio link shown on artist and studio pages (optional). Artists already
// accepted get the link they gave in their request.
// Kept out of the Drizzle schema and read with raw SQL, so the site keeps
// working if the code is deployed before this migration runs.
async function addColumn(table: "artists" | "studios") {
  try {
    await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN portfolio_url text`));
    console.log(`${table}.portfolio_url: column added`);
  } catch (e) {
    const message = e instanceof Error ? `${e.message} ${e.cause instanceof Error ? e.cause.message : ""}` : String(e);
    if (!/duplicate column name/i.test(message)) throw e;
    console.log(`${table}.portfolio_url: column already exists, skipping`);
  }
}

async function main() {
  await addColumn("artists");
  await addColumn("studios");

  // Backfill: the most recent accepted request of the artist's account that
  // had a link, only where the profile has none yet.
  const result = await db.run(sql`
    UPDATE artists SET portfolio_url = (
      SELECT s.portfolio_url FROM artist_submissions s
      WHERE s.user_id = artists.user_id AND s.status = 'accepted'
        AND s.portfolio_url IS NOT NULL AND trim(s.portfolio_url) <> ''
      ORDER BY s.created_at DESC LIMIT 1
    )
    WHERE portfolio_url IS NULL AND user_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM artist_submissions s
        WHERE s.user_id = artists.user_id AND s.status = 'accepted'
          AND s.portfolio_url IS NOT NULL AND trim(s.portfolio_url) <> ''
      )
  `);
  console.log(`artists: ${result.rowsAffected} portfolio link(s) copied from their request`);
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

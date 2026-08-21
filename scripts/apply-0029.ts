import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.run(sql.raw(`
      CREATE TABLE IF NOT EXISTS premiere_viewers (
        id text PRIMARY KEY,
        film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
        last_seen_at text NOT NULL DEFAULT (current_timestamp)
      )
    `));
    console.log("premiere_viewers: table created (or already existed)");
  } catch (e) {
    console.error(e);
    throw e;
  }
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

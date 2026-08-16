import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.run(sql.raw(`
      CREATE TABLE IF NOT EXISTS ban_appeals (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at text NOT NULL DEFAULT (current_timestamp),
        reviewed_at text
      )
    `));
    console.log("ban_appeals: table created (or already existed)");
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

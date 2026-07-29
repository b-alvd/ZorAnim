import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id text PRIMARY KEY NOT NULL,
      reveal_enabled integer DEFAULT 0 NOT NULL,
      reveal_at text
    )
  `);

  const hash = "0020_site_settings";
  await db.run(sql`
    INSERT INTO __drizzle_migrations (hash, created_at)
    SELECT ${hash}, ${Date.now()}
    WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = ${hash})
  `);

  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

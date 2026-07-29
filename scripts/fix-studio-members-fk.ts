import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.run(sql`PRAGMA foreign_keys = OFF`);

  await db.run(sql`
    CREATE TABLE studio_members_new (
      id text PRIMARY KEY NOT NULL,
      studio_id text NOT NULL,
      user_id text NOT NULL,
      status text DEFAULT 'invited' NOT NULL,
      created_at text DEFAULT (current_timestamp) NOT NULL,
      FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await db.run(sql`
    INSERT INTO studio_members_new (id, studio_id, user_id, status, created_at)
    SELECT id, studio_id, user_id, status, created_at FROM studio_members
  `);
  await db.run(sql`DROP TABLE studio_members`);
  await db.run(sql`ALTER TABLE studio_members_new RENAME TO studio_members`);
  await db.run(sql`CREATE UNIQUE INDEX studio_members_studio_user_unique ON studio_members (studio_id, user_id)`);

  await db.run(sql`PRAGMA foreign_keys = ON`);
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

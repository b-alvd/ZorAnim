import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.run(sql`ALTER TABLE site_settings ADD COLUMN maintenance_enabled integer DEFAULT 0 NOT NULL`);
  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

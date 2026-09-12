import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { client, db } from "./client";

async function main() {
  // Schema uses geography columns, so the extension must exist before migrations run.
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("migrations applied");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

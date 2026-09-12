import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://destiny:destiny@localhost:5433/destiny";

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
export { client };

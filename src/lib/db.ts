import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false,
  ssl: { rejectUnauthorized: false },
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });

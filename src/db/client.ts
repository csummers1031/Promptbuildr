import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export type DB = NeonHttpDatabase<typeof schema>;

let _db: DB | null | undefined;

/**
 * Returns the Drizzle client, or null when DATABASE_URL is not configured.
 * Everything downstream treats null as "no persistence" and degrades
 * gracefully, so the app (and previews) run without a database.
 */
export function getDb(): DB | null {
  if (_db !== undefined) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    _db = null;
    return null;
  }
  _db = drizzle(neon(url), { schema });
  return _db;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export { schema };

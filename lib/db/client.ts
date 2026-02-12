import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("Missing DATABASE_URL. Set it in .env.local");
}

// Neon/Supabase/Vercel Postgres all work with this:
export const sql = postgres(url, {
  ssl: "require",
  max: 5,
});

export const db = drizzle(sql);

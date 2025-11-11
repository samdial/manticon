import { Pool } from "pg";

const DEFAULT_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@postgres:5432/postgres";

export const pool = new Pool({
  connectionString: DEFAULT_URL,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id TEXT UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      meta JSONB
    );
  `);
  console.log("[DB] Postgres connected:", DEFAULT_URL.replace(/:[^:@/]+@/, "://****@"));
}

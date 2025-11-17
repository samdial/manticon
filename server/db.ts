import { Pool } from "pg";

function buildDatabaseUrl(): string {
  // If DATABASE_URL is explicitly set, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Otherwise, try to build from individual components
  const host = process.env.POSTGRESQL_HOST || process.env.PG_HOST || "postgres";
  const port = process.env.POSTGRESQL_PORT || process.env.PG_PORT || "5432";
  const user = process.env.POSTGRESQL_USER || process.env.PG_USER || "postgres";
  const password =
    process.env.POSTGRESQL_PASSWORD || process.env.PG_PASSWORD || "postgres";
  const database =
    process.env.POSTGRESQL_DBNAME ||
    process.env.POSTGRESQL_DB ||
    process.env.PG_DATABASE ||
    "postgres";

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

const DEFAULT_URL = buildDatabaseUrl();

console.log("[DB] Building connection string...");
const maskedUrl = DEFAULT_URL.replace(/:[^:@/]+@/, ":****@");
console.log("[DB] Connection string:", maskedUrl);

export const pool = new Pool({
  connectionString: DEFAULT_URL,
});

// Test connection on startup
pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client", err);
});

pool.on("connect", () => {
  console.log("[DB] New client connected");
});

export async function initDb(): Promise<void> {
  // Base tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_tables (
      id TEXT PRIMARY KEY,            -- human-readable id like "1"
      master_name TEXT,
      system TEXT,
      remaining_seats INT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id TEXT UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      meta JSONB,
      table_id TEXT REFERENCES game_tables(id)
    );
  `);
  // In case users existed without table_id, add it safely (older Postgres supports IF NOT EXISTS)
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS table_id TEXT REFERENCES game_tables(id);
  `);
  // Ensure new column for remaining seats exists on game_tables
  await pool.query(`
    ALTER TABLE game_tables
    ADD COLUMN IF NOT EXISTS remaining_seats INT;
  `);
  // Add new columns for expanded table information
  await pool.query(`
    ALTER TABLE game_tables
    ADD COLUMN IF NOT EXISTS adventure_name TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS novices TEXT,
    ADD COLUMN IF NOT EXISTS age_range TEXT,
    ADD COLUMN IF NOT EXISTS pregens TEXT,
    ADD COLUMN IF NOT EXISTS player_count INT,
    ADD COLUMN IF NOT EXISTS morning BOOLEAN,
    ADD COLUMN IF NOT EXISTS master_url TEXT;
  `);
  // Best-effort backfill remaining_seats from legacy users.meta.remainingSeats (minimum per table)
  await pool.query(`
    WITH per_table AS (
      SELECT
        COALESCE(u.table_id, u.meta->>'tableId') AS tid,
        MIN((u.meta->>'remainingSeats')::INT) AS min_remaining
      FROM users u
      WHERE (u.meta ? 'remainingSeats')
      GROUP BY COALESCE(u.table_id, u.meta->>'tableId')
    )
    UPDATE game_tables gt
    SET remaining_seats = per_table.min_remaining
    FROM per_table
    WHERE gt.id = per_table.tid::TEXT
      AND (gt.remaining_seats IS NULL OR per_table.min_remaining < gt.remaining_seats);
  `);
  // Best-effort backfill table_id from legacy meta
  await pool.query(`
    UPDATE users
    SET table_id = meta->>'tableId'
    WHERE table_id IS NULL AND meta ? 'tableId';
  `);
  console.log("[DB] Postgres connected:", DEFAULT_URL.replace(/:[^:@/]+@/, "://****@"));
}

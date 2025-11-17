
/*import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");

// создаём файл, если нет
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// подключаемся
export const db = new Database(dbPath);

// создаём таблицу, если не существует
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  meta TEXT
);
`);

console.log("[DB] SQLite подключена:", dbPath);*/
import { RequestHandler } from "express";
import { pool } from "../db";
import { notifyRegistration } from "../telegram";

export const handleRegister: RequestHandler = async (req, res) => {
  // Support both Telegram-based payloads and simple form: { name, age, tableId }
  const {
    telegram_id: telegramIdInput,
    username,
    first_name,
    last_name,
    meta,
    name,
    age,
    tableId,
    masterName,
    remainingSeats,
    system,
  } = req.body as {
    telegram_id?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    meta?: unknown;
    name?: string;
    age?: string | number;
    tableId?: string;
    masterName?: string;
    remainingSeats?: number;
    system?: string;
  };

  console.log("[REGISTER] incoming", {
    name,
    age,
    tableId,
    telegram_id: telegramIdInput,
  });

  // If no telegram_id provided, synthesize one to keep DB unique constraint happy
  const telegram_id =
    telegramIdInput ||
    (name ? `local:${name}:${Date.now()}` : undefined);

  if (!telegram_id) {
    console.warn("[REGISTER] rejected: no telegram_id or name");
    return res.status(400).json({ error: "telegram_id or name required" });
  }

  try {
    // Build final fields
    const finalUsername = username ?? name ?? null;
    const finalFirst = first_name ?? null;
    const finalLast = last_name ?? null;
    const combinedMeta =
      meta ??
      (name || age || tableId
        ? {
            name: name ?? null,
            age: age ?? null,
            tableId: tableId ?? null,
            masterName: masterName ?? null,
            system: system ?? null,
            remainingSeats:
              typeof remainingSeats === "number" ? remainingSeats : null,
          }
        : null);

    // Upsert table if provided
    if (tableId) {
      await pool.query(
        `
          INSERT INTO game_tables (id, master_name, system)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO UPDATE SET
            master_name = COALESCE(EXCLUDED.master_name, game_tables.master_name),
            system = COALESCE(EXCLUDED.system, game_tables.system)
        `,
        [tableId, masterName ?? null, system ?? null],
      );
      
      // Decrease remaining_seats when a user registers
      if (typeof remainingSeats === "number" && remainingSeats >= 0) {
        await pool.query(
          `
            UPDATE game_tables
            SET remaining_seats = $1
            WHERE id = $2
          `,
          [remainingSeats, tableId],
        );
      }
    }

    const upsertSql = `
      INSERT INTO users (telegram_id, username, first_name, last_name, meta)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      ON CONFLICT (telegram_id) DO UPDATE SET
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        meta = EXCLUDED.meta
      RETURNING *;
    `;
    const values = [
      telegram_id,
      finalUsername,
      finalFirst,
      finalLast,
      combinedMeta ? JSON.stringify(combinedMeta) : null,
    ];
    const { rows } = await pool.query(upsertSql, values);
    let user = rows[0];

    // Attach table_id if provided
    if (tableId) {
      const { rows: rel } = await pool.query(
        `UPDATE users SET table_id = $1 WHERE id = $2 RETURNING *`,
        [tableId, user.id],
      );
      user = rel[0] ?? user;
    }

    res.status(200).json({ ok: true, user });
    console.log("[REGISTER] success", {
      telegram_id,
      username: finalUsername,
      tableId:
        combinedMeta && typeof combinedMeta === "object"
          ? (combinedMeta as any).tableId
          : null,
    });

    // Fire-and-forget Telegram notification
    void notifyRegistration(user);

  } catch (err) {
    console.error("[REGISTER] error", err);
    res.status(500).json({ error: "internal error" });
    console.log("[REGISTER] failed payload", req.body);

  }

};


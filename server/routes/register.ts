
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
import { db } from "../db";

export const handleRegister: RequestHandler = (req, res) => {
  const { telegram_id, username, first_name, last_name, meta } = req.body;

  if (!telegram_id) {
    return res.status(400).json({ error: "telegram_id required" });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, last_name, meta)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        username=excluded.username,
        first_name=excluded.first_name,
        last_name=excluded.last_name,
        meta=excluded.meta
    `);
    stmt.run(
      telegram_id,
      username || null,
      first_name || null,
      last_name || null,
      meta ? JSON.stringify(meta) : null
    );

    const user = db
      .prepare("SELECT * FROM users WHERE telegram_id = ?")
      .get(telegram_id);

    res.status(200).json({ ok: true, user });
    console.log("[REGISTER] called", req.body);

  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    res.status(500).json({ error: "internal error" });
    console.log("[REGISTER] called", req.body);

  }

};


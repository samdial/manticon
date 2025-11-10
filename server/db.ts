import Database from "better-sqlite3";
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

console.log("[DB] SQLite подключена:", dbPath);

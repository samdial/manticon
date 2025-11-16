import { RequestHandler } from "express";
import { pool } from "../db";

export interface GameTableResponse {
  id: string;
  master_name: string | null;
  system: string | null;
  remaining_seats: number | null;
  adventure_name: string | null;
  description: string | null;
  novices: string | null;
  age_range: string | null;
  pregens: string | null;
  player_count: number | null;
}

export const handleGetTables: RequestHandler = async (_req, res) => {
  try {
    const { rows } = await pool.query<GameTableResponse>(
      `
      SELECT 
        id,
        master_name,
        system,
        remaining_seats,
        adventure_name,
        description,
        novices,
        age_range,
        pregens,
        player_count
      FROM game_tables
      ORDER BY 
        CASE 
          WHEN id ~ '^[0-9]+$' THEN id::INTEGER
          ELSE 999999
        END,
        id
      `,
    );
    res.status(200).json({ tables: rows });
  } catch (err) {
    console.error("[TABLES] error", err);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
};



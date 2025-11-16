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
    console.log("[TABLES] Fetching tables from database...");
    
    // First, check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'game_tables'
      );
    `);
    
    if (!tableCheck.rows[0]?.exists) {
      console.warn("[TABLES] Table game_tables does not exist yet");
      return res.status(200).json({ tables: [] });
    }
    
    // Simplified query without complex ORDER BY
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
      ORDER BY id
      `,
    );
    console.log("[TABLES] Found", rows.length, "tables");
    res.status(200).json({ tables: rows });
  } catch (err) {
    console.error("[TABLES] Database error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("[TABLES] Error details:", errorMessage);
    if (errorStack) {
      console.error("[TABLES] Stack trace:", errorStack);
    }
    res.status(500).json({ 
      error: "Failed to fetch tables",
      details: errorMessage 
    });
  }
};



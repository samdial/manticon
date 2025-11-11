import { pool } from "./db";

export type PlayerMeta = {
  name?: string | null;
  age?: number | string | null;
  tableId?: string | null;
  masterName?: string | null;
  system?: string | null;
  remainingSeats?: number | null;
};

export type PlayerRow = {
  id: number;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  registered_at: string;
  meta: unknown | null;
};

export type PlayerEntry = {
  id: number;
  name: string;
  age?: number | string | null;
  username?: string | null;
  meta: PlayerMeta;
};

export type TableGroup = {
  tableId: string;
  masterName?: string | null;
  system?: string | null;
  remainingSeats?: number | null;
  players: PlayerEntry[];
};

export function safeParseMeta(meta: unknown | null): PlayerMeta {
  if (meta == null) return {};
  if (typeof meta === "object") {
    return meta as PlayerMeta;
  }
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta) as PlayerMeta;
    } catch {
      return {};
    }
  }
  return {};
}

function mapName(meta: PlayerMeta, fallback?: string | null): string {
  const rawName = meta.name ?? fallback ?? "";
  return rawName ? String(rawName) : "(без имени)";
}

export function mapRow(row: PlayerRow): { entry: PlayerEntry; tableId: string; meta: PlayerMeta } {
  const meta = safeParseMeta(row.meta);
  const tableId = meta.tableId ? String(meta.tableId) : "—";
  const entry: PlayerEntry = {
    id: row.id,
    name: mapName(meta, row.username),
    age: meta.age ?? null,
    username: row.username ?? undefined,
    meta,
  };
  return { entry, tableId, meta };
}

export function getTableGroups(): TableGroup[] {
  // This synchronous wrapper is kept for compatibility; actual query is async below.
  throw new Error("getTableGroups is async; use getTableGroupsAsync()");
}

export async function getTableGroupsAsync(): Promise<TableGroup[]> {
  const { rows } = await pool.query<PlayerRow>(
    "SELECT * FROM users ORDER BY registered_at ASC",
  );

  const byTable = new Map<string, TableGroup>();

  for (const row of rows) {
    const { entry, tableId, meta } = mapRow(row);
    const group =
      byTable.get(tableId) ??
      {
        tableId,
        players: [],
      };

    if (meta.masterName) group.masterName = meta.masterName;
    if (meta.system) group.system = meta.system;
    if (
      typeof meta.remainingSeats === "number" &&
      (group.remainingSeats === undefined ||
        group.remainingSeats === null ||
        meta.remainingSeats < group.remainingSeats)
    ) {
      group.remainingSeats = meta.remainingSeats;
    }

    group.players.push(entry);
    byTable.set(tableId, group);
  }

  const groups = Array.from(byTable.values());
  groups.sort((a, b) => {
    const na = Number(a.tableId);
    const nb = Number(b.tableId);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.tableId.localeCompare(b.tableId);
  });
  return groups;
}

export async function getTableGroupAsync(tableId: string): Promise<TableGroup | undefined> {
  const { rows } = await pool.query<PlayerRow>(
    "SELECT * FROM users WHERE (meta->>'tableId') = $1 ORDER BY registered_at ASC",
    [tableId],
  );
  const byTable = new Map<string, TableGroup>();
  for (const row of rows) {
    const { entry, tableId: tid, meta } = mapRow(row);
    const group =
      byTable.get(tid) ??
      {
        tableId: tid,
        players: [],
      };
    if (meta.masterName) group.masterName = meta.masterName;
    if (meta.system) group.system = meta.system;
    if (
      typeof meta.remainingSeats === "number" &&
      (group.remainingSeats === undefined ||
        group.remainingSeats === null ||
        meta.remainingSeats < group.remainingSeats)
    ) {
      group.remainingSeats = meta.remainingSeats;
    }
    group.players.push(entry);
    byTable.set(tid, group);
  }
  return Array.from(byTable.values())[0];
}

export async function deletePlayerByIdAsync(id: number): Promise<PlayerEntry | null> {
  const { rows } = await pool.query<PlayerRow>("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
  if (!rows.length) return null;
  return mapRow(rows[0]).entry;
}

export function buildPlayersReport(groups: TableGroup[]): string {
  if (!groups.length) {
    return "";
  }
  const sections: string[] = [];
  groups.forEach((group, idx) => {
    const header = `Стол ${group.tableId}, мастер: ${group.masterName ?? "-"}, система: ${group.system ?? "-"}`;
    const players = group.players
      .map((player) => {
        const age =
          player.age !== undefined &&
          player.age !== null &&
          String(player.age).trim() !== ""
            ? `, ${player.age}`
            : "";
        return `- ${player.name}${age}`;
      })
      .join("\n");
    const section = `${header}:\n\n${players}`;
    sections.push(section);
    if (idx < groups.length - 1) {
      sections.push("\n-------------------------------");
    }
  });
  return sections.join("\n");
}

export function buildTableKeyboard(groups: TableGroup[]) {
  return {
    inline_keyboard: groups.map((group) => [
      {
        text:
          group.tableId === "—"
            ? "Удалить из стола «Без стола»"
            : `Удалить из стола ${group.tableId}`,
        callback_data: `del:table:${group.tableId}`,
      },
    ]),
  };
}

export function buildPlayersKeyboard(group: TableGroup) {
  return {
    inline_keyboard: group.players.map((player) => {
      const age =
        player.age !== undefined &&
        player.age !== null &&
        String(player.age).trim() !== ""
          ? `, ${player.age} лет`
          : "";
      return [
        {
          text: `${player.name}${age}`,
          callback_data: `del:user:${player.id}`,
        },
      ];
    }),
  };
}


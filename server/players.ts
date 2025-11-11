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
  const { rows } = await pool.query(
    `
      SELECT
        u.*,
        t.id AS _table_id,
        t.master_name AS _master_name,
        t.system AS _system,
        t.remaining_seats AS _remaining_seats
      FROM users u
      LEFT JOIN game_tables t ON t.id = u.table_id
      ORDER BY u.registered_at ASC
    `,
  );

  const byTable = new Map<string, TableGroup>();

  for (const row of rows) {
    const { entry, tableId, meta } = mapRow(row as any);
    // Prefer normalized table fields over meta
    const normalizedTableId =
      (row as any)._table_id != null ? String((row as any)._table_id) : tableId;
    const normalizedMaster =
      (row as any)._master_name != null
        ? String((row as any)._master_name)
        : meta.masterName ?? undefined;
    const normalizedSystem =
      (row as any)._system != null ? String((row as any)._system) : meta.system ?? undefined;
    const normalizedRemaining =
      (row as any)._remaining_seats != null
        ? Number((row as any)._remaining_seats)
        : undefined;

    const group =
      byTable.get(normalizedTableId) ??
      {
        tableId: normalizedTableId,
        players: [],
      };

    if (normalizedMaster) group.masterName = normalizedMaster;
    if (normalizedSystem) group.system = normalizedSystem;
    if (normalizedRemaining != null && Number.isFinite(normalizedRemaining)) {
      group.remainingSeats = normalizedRemaining;
    } else {
      // Fallback for legacy data: use minimal meta.remainingSeats among players
      if (
        typeof meta.remainingSeats === "number" &&
        (group.remainingSeats === undefined ||
          group.remainingSeats === null ||
          meta.remainingSeats < group.remainingSeats)
      ) {
        group.remainingSeats = meta.remainingSeats;
      }
    }

    group.players.push(entry);
    byTable.set(normalizedTableId, group);
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
  const res =
    tableId === "__none"
      ? await pool.query(
          `
            SELECT
              u.*,
              t.id AS _table_id,
              t.master_name AS _master_name,
              t.system AS _system,
              t.remaining_seats AS _remaining_seats
            FROM users u
            LEFT JOIN game_tables t ON t.id = u.table_id
            WHERE u.table_id IS NULL
            ORDER BY u.registered_at ASC
          `,
        )
      : await pool.query(
          `
            SELECT
              u.*,
              t.id AS _table_id,
              t.master_name AS _master_name,
              t.system AS _system,
              t.remaining_seats AS _remaining_seats
            FROM users u
            LEFT JOIN game_tables t ON t.id = u.table_id
            WHERE u.table_id = $1
            ORDER BY u.registered_at ASC
          `,
          [tableId],
        );
  const rows = res.rows as any[];
  const byTable = new Map<string, TableGroup>();
  for (const row of rows) {
    const { entry, tableId: tid, meta } = mapRow(row as any);
    const normalizedTableId =
      row._table_id != null ? String(row._table_id) : tid;
    const normalizedMaster =
      row._master_name != null ? String(row._master_name) : meta.masterName ?? undefined;
    const normalizedSystem =
      row._system != null ? String(row._system) : meta.system ?? undefined;
    const normalizedRemaining =
      row._remaining_seats != null ? Number(row._remaining_seats) : undefined;
    const group =
      byTable.get(normalizedTableId) ??
      {
        tableId: normalizedTableId,
        players: [],
      };
    if (normalizedMaster) group.masterName = normalizedMaster;
    if (normalizedSystem) group.system = normalizedSystem;
    if (normalizedRemaining != null && Number.isFinite(normalizedRemaining)) {
      group.remainingSeats = normalizedRemaining;
    } else {
      if (
        typeof meta.remainingSeats === "number" &&
        (group.remainingSeats === undefined ||
          group.remainingSeats === null ||
          meta.remainingSeats < group.remainingSeats)
      ) {
        group.remainingSeats = meta.remainingSeats;
      }
    }
    group.players.push(entry);
    byTable.set(normalizedTableId, group);
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
  // Показываем только корректные столы (есть tableId, не "—")
  const knownTables = groups.filter((g) => g.tableId !== "—" && g.players.length > 0);
  // Отдельно собираем "Без стола"
  const unknown = groups.find((g) => g.tableId === "—" && g.players.length > 0);

  const sections: string[] = [];
  knownTables.forEach((group, idx) => {
    const header = `Стол ${group.tableId}, мастер: ${group.masterName ?? "-"}, система: ${
      group.system ?? "-"
    }, свободных мест: ${group.remainingSeats ?? "-"}.`;
    const players = group.players
      .map((player) => {
        const age =
          player.age !== undefined &&
          player.age !== null &&
          String(player.age).trim() !== ""
            ? `, ${player.age}`
            : "";
        // Используем символ • вместо дефиса, чтобы Телеграм не превращал строки в список с дополнительными отступами
        return `• ${player.name}${age}`;
      })
      .join("\n");
    const section = `${header}\n${players}`;
    sections.push(section);
    if (idx < knownTables.length - 1 || (knownTables.length && unknown)) {
      sections.push("\n-------------------------------");
    }
  });

  // Добавим блок без стола только если есть такие записи
  if (unknown) {
    const players = unknown.players
      .map((player) => {
        const age =
          player.age !== undefined &&
          player.age !== null &&
          String(player.age).trim() !== ""
            ? `, ${player.age}`
            : "";
        return `• ${player.name}${age}`;
      })
      .join("\n");
    const section = `Стол —, мастер: -, система: -, свободных мест: -.\n${players}`;
    sections.push(section);
  }

  return sections.join("\n");
}

export function buildTableKeyboard(groups: TableGroup[]) {
  return {
    inline_keyboard: groups
      .filter((g) => g.tableId !== "—" && g.players.length > 0)
      .map((group) => [
        {
          text: `Удалить из стола ${group.tableId}`,
          callback_data: `del:table:${group.tableId}`,
        },
      ])
      .concat(
        // Кнопка для "Без стола" в конце, если есть такие записи
        groups.some((g) => g.tableId === "—" && g.players.length > 0)
          ? [
              [
                {
                  text: "Удалить из стола «Без стола»",
                  callback_data: "del:table:__none",
                },
              ],
            ]
          : [],
      ),
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

export async function countOrphanedUsersAsync(): Promise<number> {
  const res = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM users
      WHERE table_id IS NULL
        AND meta ? 'tableId'
    `,
  );
  return Number(res.rows[0]?.count ?? 0);
}

export async function cleanupOrphanedUsersAsync(): Promise<number> {
  const res = await pool.query<{ id: number }>(
    `
      DELETE FROM users
      WHERE id IN (
        SELECT id
        FROM users
        WHERE table_id IS NULL
          AND meta ? 'tableId'
      )
      RETURNING id
    `,
  );
  return res.rows.length;
}


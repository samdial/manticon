import { db } from "./db";

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
  meta: string | null;
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

export function safeParseMeta(meta: string | null): PlayerMeta {
  if (!meta) return {};
  try {
    return JSON.parse(meta) as PlayerMeta;
  } catch {
    return {};
  }
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
  const rows = db
    .prepare<PlayerRow>("SELECT * FROM users ORDER BY registered_at ASC")
    .all();

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

export function getTableGroup(tableId: string): TableGroup | undefined {
  const groups = getTableGroups();
  return groups.find((g) => g.tableId === tableId);
}

export function deletePlayerById(id: number): PlayerEntry | null {
  const row = db.prepare<PlayerRow>("SELECT * FROM users WHERE id = ?").get(id);
  if (!row) return null;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return mapRow(row).entry;
}

export function buildPlayersReport(groups: TableGroup[]): string {
  if (!groups.length) {
    return "";
  }
  const sections = groups.map((group) => {
    const header = `стол ${group.tableId} мастер ${group.masterName ?? "-"}, система ${group.system ?? "-"}, свободных мест: ${group.remainingSeats ?? "-"}.`;
    const players = group.players
      .map((player) => {
        const age =
          player.age !== undefined &&
          player.age !== null &&
          String(player.age).trim() !== ""
            ? `, ${player.age} лет`
            : "";
        return `- ${player.name}${age}`;
      })
      .join("\n");
    return `${header}\n\n${players}`;
  });

  return sections.join("\n\n\n");
}

export function buildTableKeyboard(groups: TableGroup[]) {
  return {
    inline_keyboard: groups.map((group) => [
      {
        text: `Удалить из стола ${group.tableId}`,
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


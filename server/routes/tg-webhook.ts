import { RequestHandler } from "express";
import { db } from "../db";
import { sendTelegramMessage, sendTelegramWithMarkup } from "../telegram";

type Row = {
  id: number;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  registered_at: string;
  meta: string | null;
};

type Meta = {
  name?: string | null;
  age?: number | string | null;
  tableId?: string | null;
  masterName?: string | null;
  system?: string | null;
  remainingSeats?: number | null;
};

function safeParseMeta(meta: string | null): Meta {
  if (!meta) return {};
  try {
    return JSON.parse(meta) as Meta;
  } catch {
    return {};
  }
}

function buildPlayersReport(rows: Row[]): string {
  // Group by tableId
  const byTable = new Map<
    string,
    {
      tableId: string;
      masterName?: string | null;
      system?: string | null;
      remainingSeats?: number | null;
      players: Array<{ name?: string | null; age?: string | number | null }>;
    }
  >();

  for (const r of rows) {
    const meta = safeParseMeta(r.meta);
    const tableId = meta.tableId ? String(meta.tableId) : "—";
    const entry =
      byTable.get(tableId) ||
      {
        tableId,
        masterName: undefined,
        system: undefined,
        remainingSeats: undefined,
        players: [],
      };
    // take latest known master/system, and minimum remainingSeats as most conservative
    if (meta.masterName) entry.masterName = meta.masterName;
    if (meta.system) entry.system = meta.system;
    if (
      typeof meta.remainingSeats === "number" &&
      (entry.remainingSeats === undefined ||
        entry.remainingSeats === null ||
        meta.remainingSeats < entry.remainingSeats)
    ) {
      entry.remainingSeats = meta.remainingSeats;
    }
    entry.players.push({ name: meta.name ?? r.username, age: meta.age ?? null });
    byTable.set(tableId, entry);
  }

  const sections: string[] = [];
  // Sort by numeric table id if possible
  const keys = Array.from(byTable.keys()).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });

  for (const key of keys) {
    const t = byTable.get(key)!;
    const header = `стол ${t.tableId} мастер ${t.masterName ?? "-"}, система ${t.system ?? "-"}, свободных мест: ${t.remainingSeats ?? "-"}.`;
    const players = t.players
      .map((p) => {
        const nm = (p.name && String(p.name)) || "-";
        const ag =
          p.age !== undefined && p.age !== null && String(p.age).trim() !== ""
            ? `${p.age} лет`
            : "";
        return `- ${nm}${ag ? `, ${ag}` : ""}`;
      })
      .join("\n");
    sections.push(`${header}\n\n${players}`);
  }

  return sections.join("\n\n\n");
}

export const handleTelegramWebhook: RequestHandler = async (req, res) => {
  try {
    const update = req.body as any;
    const message = update?.message;
    const callbackQuery = update?.callback_query;
    const chatId = message?.chat?.id ?? callbackQuery?.message?.chat?.id;
    const chatType = message?.chat?.type ?? callbackQuery?.message?.chat?.type;
    const text = (message?.text as string | undefined)?.trim();
    const cdata = callbackQuery?.data as string | undefined;

    console.log("[TG] incoming update", {
      chatId,
      chatType,
      text: text ?? null,
      data: cdata ?? null,
      hasMessage: Boolean(message),
      hasCallback: Boolean(callbackQuery),
    });

    if (!chatId || (!text && !cdata)) {
      return res.status(200).json({ ok: true });
    }

    // Deletion flow: select table
    if (cdata && cdata.startsWith("del:table:")) {
      const tableId = cdata.slice("del:table:".length);
      const rows = db
        .prepare<Row>("SELECT * FROM users WHERE json_extract(meta, '$.tableId') = ? ORDER BY registered_at ASC")
        .all(tableId);
      if (!rows.length) {
        await sendTelegramMessage(chatId, `В столе ${tableId} пока нет записей.`);
        return res.status(200).json({ ok: true });
      }
      const keyboard = {
        inline_keyboard: rows.map((r) => {
          const meta = safeParseMeta(r.meta);
          const nm = meta.name ?? r.username ?? "(без имени)";
          const ag = meta.age ? `, ${meta.age} лет` : "";
          return [
            {
              text: `${nm}${ag}`,
              callback_data: `del:user:${r.id}`,
            },
          ];
        }),
      };
      await sendTelegramWithMarkup(
        chatId,
        `Выберите игрока для удаления из стола ${tableId}:`,
        keyboard,
      );
      return res.status(200).json({ ok: true });
    }

    // Deletion flow: confirm and delete
    if (cdata && cdata.startsWith("del:user:")) {
      const idStr = cdata.slice("del:user:".length);
      const id = Number(idStr);
      if (!Number.isFinite(id)) {
        await sendTelegramMessage(chatId, "Некорректный идентификатор игрока.");
        return res.status(200).json({ ok: true });
      }
      const row = db.prepare<Row>("SELECT * FROM users WHERE id = ?").get(id);
      if (!row) {
        await sendTelegramMessage(chatId, "Игрок уже удалён или не найден.");
        return res.status(200).json({ ok: true });
      }
      const meta = safeParseMeta(row.meta);
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      const nm = meta.name ?? row.username ?? "(без имени)";
      const tableId = meta.tableId ? `из стола ${meta.tableId}` : "";
      await sendTelegramMessage(chatId, `Удалён игрок ${nm} ${tableId}.`);
      return res.status(200).json({ ok: true });
    }

    if (text && text.startsWith("/players")) {
      const rows = db
        .prepare<Row>("SELECT * FROM users ORDER BY registered_at ASC")
        .all();
      const report = buildPlayersReport(rows);
      await sendTelegramMessage(chatId, report || "Список пуст.");
      if (rows.length) {
        // collect unique tableIds
        const tableIds = Array.from(
          new Set(
            rows
              .map((r) => safeParseMeta(r.meta).tableId)
              .filter((v) => v !== undefined && v !== null)
              .map((v) => String(v)),
          ),
        ).sort((a, b) => {
          const na = Number(a);
          const nb = Number(b);
          if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
          return a.localeCompare(b);
        });
        if (tableIds.length) {
          const keyboard = {
            inline_keyboard: tableIds.map((tid) => [
              { text: `Удалить из стола ${tid}`, callback_data: `del:table:${tid}` },
            ]),
          };
          await sendTelegramWithMarkup(
            chatId,
            "Чтобы удалить игрока, выберите стол:",
            keyboard,
          );
        }
      }
      return res.status(200).json({ ok: true });
    }

    // Unknown command: ignore politely
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[TG WEBHOOK] error", err);
    return res.status(200).json({ ok: true });
  }
};



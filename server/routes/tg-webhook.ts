import { RequestHandler } from "express";
import {
  buildPlayersKeyboard,
  buildPlayersReport,
  buildTableKeyboard,
  deletePlayerById,
  getTableGroup,
  getTableGroups,
} from "../players";
import { sendTelegramMessage, sendTelegramWithMarkup } from "../telegram";

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

    if (cdata && cdata.startsWith("del:table:")) {
      const tableId = cdata.slice("del:table:".length);
      const group = getTableGroup(tableId);
      if (!group || !group.players.length) {
        await sendTelegramMessage(chatId, `В столе ${tableId} пока нет записей.`);
        return res.status(200).json({ ok: true });
      }
      const keyboard = buildPlayersKeyboard(group);
      await sendTelegramWithMarkup(
        chatId,
        `Выберите игрока для удаления из стола ${tableId}:`,
        keyboard,
      );
      return res.status(200).json({ ok: true });
    }

    if (cdata && cdata.startsWith("del:user:")) {
      const idStr = cdata.slice("del:user:".length);
      const id = Number(idStr);
      if (!Number.isFinite(id)) {
        await sendTelegramMessage(chatId, "Некорректный идентификатор игрока.");
        return res.status(200).json({ ok: true });
      }
      const removed = deletePlayerById(id);
      if (!removed) {
        await sendTelegramMessage(chatId, "Игрок уже удалён или не найден.");
        return res.status(200).json({ ok: true });
      }
      const tableSuffix = removed.meta.tableId ? `из стола ${removed.meta.tableId}` : "";
      await sendTelegramMessage(chatId, `Удалён игрок ${removed.name} ${tableSuffix}.`);
      return res.status(200).json({ ok: true });
    }

    if (text && text.startsWith("/players")) {
      const groups = getTableGroups();
      const report = buildPlayersReport(groups);
      await sendTelegramMessage(chatId, report || "Список пуст.");
      if (groups.length) {
        const keyboard = buildTableKeyboard(groups);
        await sendTelegramWithMarkup(
          chatId,
          "Чтобы удалить игрока, выберите стол:",
          keyboard,
        );
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[TG WEBHOOK] error", err);
    return res.status(200).json({ ok: true });
  }
};


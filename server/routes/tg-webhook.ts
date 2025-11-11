import { RequestHandler } from "express";
import {
  buildPlayersKeyboard,
  buildPlayersReport,
  buildTableKeyboard,
  deletePlayerByIdAsync,
  getTableGroupAsync,
  getTableGroupsAsync,
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
      const raw = cdata.slice("del:table:".length);
      const tableId = raw === "__none" ? "__none" : raw;
      const group = await getTableGroupAsync(tableId);
      if (!group || !group.players.length) {
        const label = tableId === "__none" ? "«Без стола»" : tableId;
        await sendTelegramMessage(chatId, `В столе ${label} пока нет записей.`);
        return res.status(200).json({ ok: true });
      }
      const keyboard = buildPlayersKeyboard(group);
      await sendTelegramWithMarkup(
        chatId,
        `Выберите игрока для удаления из стола ${tableId === "__none" ? "«Без стола»" : tableId}:`,
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
      const removed = await deletePlayerByIdAsync(id);
      if (!removed) {
        await sendTelegramMessage(chatId, "Игрок уже удалён или не найден.");
        return res.status(200).json({ ok: true });
      }
      const tableSuffix = removed.meta.tableId ? `из стола ${removed.meta.tableId}` : "";
      await sendTelegramMessage(chatId, `Удалён игрок ${removed.name} ${tableSuffix}.`);
      return res.status(200).json({ ok: true });
    }

    if (cdata === "cleanup:orphans") {
      const { cleanupOrphanedUsersAsync, getTableGroupsAsync, buildPlayersReport, buildTableKeyboard, countOrphanedUsersAsync } = await import("../players");
      const deleted = await cleanupOrphanedUsersAsync();
      await sendTelegramMessage(chatId, `Удалено несвязанных записей: ${deleted}.`);
      const groups = await getTableGroupsAsync();
      const report = buildPlayersReport(groups);
      await sendTelegramMessage(chatId, report || "Список пуст.");
      if (groups.length) {
        const keyboard = buildTableKeyboard(groups) as any;
        const orphanCount = await countOrphanedUsersAsync();
        if (orphanCount > 0) {
          keyboard.inline_keyboard.push([
            { text: `Удалить несвязанные записи (${orphanCount})`, callback_data: "cleanup:orphans" },
          ]);
        }
        await sendTelegramWithMarkup(
          chatId,
          "Чтобы удалить игрока, выберите стол:",
          keyboard,
        );
      }
      return res.status(200).json({ ok: true });
    }

    if (text && text.startsWith("/players")) {
      const groups = await getTableGroupsAsync();
      const report = buildPlayersReport(groups);
      await sendTelegramMessage(chatId, report || "Список пуст.");
      if (groups.length) {
        const keyboard = buildTableKeyboard(groups) as any;
        try {
          const orphanCount = await (await import("../players")).countOrphanedUsersAsync();
          if (orphanCount > 0) {
            keyboard.inline_keyboard.push([
              { text: `Удалить несвязанные записи (${orphanCount})`, callback_data: "cleanup:orphans" },
            ]);
          }
        } catch {}
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


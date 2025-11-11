import TelegramBot from "node-telegram-bot-api";
import {
  buildPlayersKeyboard,
  buildPlayersReport,
  buildTableKeyboard,
  countOrphanedUsersAsync,
  cleanupOrphanedUsersAsync,
  deletePlayerByIdAsync,
  getTableGroupAsync,
  getTableGroupsAsync,
} from "./players";
import { getBotToken } from "./telegram";

let botInstance: TelegramBot | null = null;
let botStarting = false;

async function sendPlayersOverview(chatId: number | string) {
  if (!botInstance) return;
  const groups = await getTableGroupsAsync();
  const report = buildPlayersReport(groups);

  await botInstance.sendMessage(chatId, report || "Список пуст.").catch((err) => {
    console.error("[Telegram bot] failed to send players list", err);
  });

  if (groups.length) {
    const keyboard = buildTableKeyboard(groups) as any;
    const orphanCount = await countOrphanedUsersAsync().catch(() => 0);
    if (orphanCount > 0) {
      keyboard.inline_keyboard.push([
        { text: `Удалить несвязанные записи (${orphanCount})`, callback_data: "cleanup:orphans" },
      ]);
    }
    await botInstance
      .sendMessage(chatId, "Чтобы удалить игрока, выберите стол:", {
        reply_markup: keyboard,
      })
      .catch((err) => {
        console.error("[Telegram bot] failed to send table keyboard", err);
      });
  }
}

async function handleTableSelection(chatId: number | string, tableId: string) {
  if (!botInstance) return;
  const group = await getTableGroupAsync(tableId);
  if (!group || !group.players.length) {
    await botInstance
      .sendMessage(chatId, `В столе ${tableId} пока нет записей.`)
      .catch((err) => {
        console.error("[Telegram bot] failed to send empty table notice", err);
      });
    return;
  }
  const keyboard = buildPlayersKeyboard(group);
  await botInstance
    .sendMessage(chatId, `Выберите игрока для удаления из стола ${tableId}:`, {
      reply_markup: keyboard,
    })
    .catch((err) => {
      console.error("[Telegram bot] failed to send player keyboard", err);
    });
}

async function handlePlayerDeletion(chatId: number | string, id: number) {
  if (!botInstance) return;
  const removed = await deletePlayerByIdAsync(id);
  if (!removed) {
    await botInstance
      .sendMessage(chatId, "Игрок уже удалён или не найден.")
      .catch((err) => {
        console.error("[Telegram bot] failed to send missing player notice", err);
      });
    return;
  }

  const tableSuffix = removed.meta.tableId ? `из стола ${removed.meta.tableId}` : "";
  await botInstance
    .sendMessage(chatId, `Удалён игрок ${removed.name} ${tableSuffix}.`)
    .catch((err) => {
      console.error("[Telegram bot] failed to send deletion confirmation", err);
    });

  await sendPlayersOverview(chatId);
}

export function startTelegramBot(): TelegramBot | null {
  if (botInstance || botStarting) {
    return botInstance;
  }
  if (process.env.DISABLE_TELEGRAM_BOT === "true") {
    console.log("[Telegram bot] launch skipped (DISABLE_TELEGRAM_BOT=true)");
    return null;
  }

  const token = getBotToken();
  if (!token) {
    console.warn("[Telegram bot] TG_BOT_TOKEN not provided, bot disabled");
    return null;
  }

  botStarting = true;
  const bot = new TelegramBot(token, { polling: true });
  botInstance = bot;
  botStarting = false;

  bot
    .getMe()
    .then((me) => {
      console.log(
        `[Telegram bot] polling started as @${me.username ?? me.first_name ?? "unknown"}`,
      );
    })
    .catch(() => {
      console.log("[Telegram bot] polling started");
    });

  bot.onText(/^\/players(?:@.+)?$/, async (msg) => {
    const chatId = msg.chat.id;
    await sendPlayersOverview(chatId);
  });

  bot.on("callback_query", async (query) => {
    try {
      if (!query.message?.chat?.id || !query.data || !botInstance) {
        if (query.id) {
          await botInstance?.answerCallbackQuery(query.id).catch(() => {});
        }
        return;
      }
      const chatId = query.message.chat.id;
      const data = query.data;

      if (data.startsWith("del:table:")) {
        const tableId = data.slice("del:table:".length);
        await handleTableSelection(chatId, tableId);
      } else if (data.startsWith("del:user:")) {
        const id = Number(data.slice("del:user:".length));
        if (!Number.isFinite(id)) {
          await botInstance
            .sendMessage(chatId, "Некорректный идентификатор игрока.")
            .catch((err) => {
              console.error("[Telegram bot] failed to send invalid id notice", err);
            });
        } else {
          await handlePlayerDeletion(chatId, id);
        }
      } else if (data === "cleanup:orphans") {
        const deleted = await cleanupOrphanedUsersAsync();
        await botInstance
          .sendMessage(chatId, `Удалено несвязанных записей: ${deleted}.`)
          .catch(() => {});
        await sendPlayersOverview(chatId);
      }

      if (query.id) {
        await botInstance.answerCallbackQuery(query.id).catch(() => {});
      }
    } catch (err) {
      console.error("[Telegram bot] callback error", err);
    }
  });

  bot.on("polling_error", (err) => {
    console.error("[Telegram bot] polling error", err);
  });

  return botInstance;
}



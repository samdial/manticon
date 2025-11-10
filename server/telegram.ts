import type { IncomingHttpHeaders } from "http";

//const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
//const TG_ADMIN_CHAT_ID = process.env.TG_ADMIN_CHAT_ID;
const TG_BOT_TOKEN = "8244363844:AAEuXcxW7HDm2YfNK3048Iq9icMvuwoi674";
const TG_ADMIN_CHAT_ID = "-1003339269630";
type PlainObject = Record<string, unknown>;

export interface TelegramUserPayload extends PlainObject {
  id?: number | string;
  telegram_id?: string | number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  registered_at?: string | null;
  meta?: string | PlainObject | null;
}

function ensureEnv(): { token: string; adminChatId: string } | null {
  console.log("[Telegram] ensureEnv", { TG_BOT_TOKEN, TG_ADMIN_CHAT_ID });

  if (!TG_BOT_TOKEN || !TG_ADMIN_CHAT_ID) {
    return null;
  }
  return { token: TG_BOT_TOKEN, adminChatId: TG_ADMIN_CHAT_ID };

}

export function getBotToken(): string | null {
  return TG_BOT_TOKEN ?? null;
}

function buildMessage(user: TelegramUserPayload): string {
  // meta may be stringified JSON or object
  let meta: Record<string, unknown> | null = null;
  if (typeof user.meta === "string") {
    try {
      meta = JSON.parse(user.meta) as Record<string, unknown>;
    } catch {
      meta = null;
    }
  } else if (user.meta && typeof user.meta === "object") {
    meta = user.meta as Record<string, unknown>;
  }

  const name =
    (meta?.name && String(meta.name)) ||
    (user.username && String(user.username)) ||
    "";
  const age = meta?.age !== undefined && meta?.age !== null ? String(meta.age) : "";
  const masterName =
    meta?.masterName !== undefined && meta?.masterName !== null
      ? String(meta.masterName)
      : "";
  const remaining =
    meta?.remainingSeats !== undefined && meta?.remainingSeats !== null
      ? String(meta.remainingSeats)
      : "";

  const lines = [
    "Новая регистрация!",
    `имя: ${name || "-"}`,
    `возраст: ${age || "-"}`,
    `мастер: ${masterName || "-"}`,
    `осталось свободных мест у мастера: ${remaining || "-"}`,
  ];
  return lines.join("\n");
}

async function callTelegram(
  token: string,
  method: string,
  body: Record<string, unknown>,
  headers?: IncomingHttpHeaders,
): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === "string") {
        finalHeaders[key] = value;
      } else if (Array.isArray(value) && value.length) {
        finalHeaders[key] = value.join(", ");
      }
    }
  }

  await fetch(url, {
    method: "POST",
    headers: finalHeaders,
    body: JSON.stringify(body),
  }).then(async (r) => {
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`Telegram API error: ${r.status} ${r.statusText} ${text}`);
    }
  });
}

export async function notifyRegistration(user: TelegramUserPayload): Promise<void> {
  const env = ensureEnv();
  if (!env) {
    // Silently skip if not configured
    return;
  }
  const { token, adminChatId } = env;
  const text = buildMessage(user);
  try {
    await callTelegram(token, "sendMessage", {
      chat_id: adminChatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error("[Telegram] notifyRegistration failed:", err);
  }
}

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<void> {
  const env = ensureEnv();
  if (!env) return;
  const { token } = env;
  try {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text,
    });
  } catch (err) {
    console.error("[Telegram] sendTelegramMessage failed:", err);
  }
}

export async function sendTelegramWithMarkup(
  chatId: string | number,
  text: string,
  replyMarkup: unknown,
): Promise<void> {
  const env = ensureEnv();
  if (!env) return;
  const { token } = env;
  try {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    });
  } catch (err) {
    console.error("[Telegram] sendTelegramWithMarkup failed:", err);
  }
}



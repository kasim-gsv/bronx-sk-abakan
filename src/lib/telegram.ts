/**
 * Отправка заявки в Telegram-бот.
 *
 * Нужны две переменные окружения (см. .env.local.example):
 *   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
 *   TELEGRAM_CHAT_ID   — id чата/канала или @username, куда приходят заявки
 *
 * Если переменные не заданы, заявка не теряется молча: она пишется в лог
 * сервера, а функция возвращает delivered: false.
 */

export type LeadPayload = {
  name: string;
  phone: string;
  direction: string;
  comment: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function isTelegramConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
  );
}

export function formatLeadMessage(lead: LeadPayload) {
  return [
    "<b>Новая заявка с сайта</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(lead.name)}`,
    `<b>Телефон:</b> ${escapeHtml(lead.phone)}`,
    `<b>Направление:</b> ${escapeHtml(lead.direction)}`,
    lead.comment ? `<b>Комментарий:</b> ${escapeHtml(lead.comment)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendLeadToTelegram(
  lead: LeadPayload,
): Promise<{ delivered: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[lead] Telegram не настроен (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID). Заявка:",
      lead,
    );
    return { delivered: false };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatLeadMessage(lead),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Telegram API ответил ${response.status}: ${details.slice(0, 300)}`,
    );
  }

  return { delivered: true };
}

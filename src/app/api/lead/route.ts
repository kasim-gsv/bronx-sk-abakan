import { isTelegramConfigured, sendLeadToTelegram } from "@/lib/telegram";
import { readSessionUserId } from "@/lib/auth";
import { saveLead } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";

function asString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  // До 5 заявок с одного IP за 10 минут.
  const limit = checkRateLimit(request, {
    scope: "lead",
    windowMs: 10 * 60 * 1000,
    max: 5,
  });

  if (limit.limited) {
    return Response.json(
      { error: "Слишком много заявок. Позвоните нам, пожалуйста." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  // Скрытое поле заполняют только боты.
  if (asString(body.company, 100)) {
    return Response.json({ ok: true, delivered: false });
  }

  const name = asString(body.name, 80);
  const phoneInput = asString(body.phone, 30);
  const direction = asString(body.direction, 60) || "не указано";
  const comment = asString(body.comment, 600);
  const consent = body.consent === true;

  if (name.length < 2) {
    return Response.json({ error: "Укажите имя." }, { status: 422 });
  }

  const phone = normalizePhone(phoneInput);
  if (!phone) {
    return Response.json({ error: "Проверьте номер телефона." }, { status: 422 });
  }

  if (!consent) {
    return Response.json(
      { error: "Без согласия на обработку данных заявку принять нельзя." },
      { status: 422 },
    );
  }

  // Сначала сохраняем заявку в базу: она не должна потеряться, даже если
  // Telegram не настроен или временно недоступен. Администратор увидит её
  // в разделе «Заявки» админки.
  let savedToDb = false;
  try {
    const userId = await readSessionUserId();
    saveLead({
      userId,
      name,
      phone: phone.value,
      direction,
      comment,
    });
    savedToDb = true;
  } catch (dbError) {
    console.error("[lead] Не удалось сохранить заявку в базу:", dbError);
  }

  if (!isTelegramConfigured()) {
    // Заявка в базе есть, уведомление отправить некуда — не показываем ошибку.
    return Response.json({ ok: true, delivered: false, stored: savedToDb });
  }

  try {
    const result = await sendLeadToTelegram({
      name,
      phone: phone.value,
      direction,
      comment,
    });
    return Response.json({ ok: true, delivered: result.delivered, stored: savedToDb });
  } catch (error) {
    console.error("[lead] Не удалось отправить заявку в Telegram:", error);

    if (savedToDb) {
      // Заявка сохранена, потеряется только мгновенное уведомление.
      return Response.json({ ok: true, delivered: false, stored: true, telegramFailed: true });
    }

    return Response.json(
      { error: "Не удалось отправить заявку. Позвоните нам напрямую." },
      { status: 502 },
    );
  }
}

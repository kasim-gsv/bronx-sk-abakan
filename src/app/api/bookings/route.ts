import { NextResponse } from "next/server";
import { readSessionUserId } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";
import { BookingError, createBooking, getSession } from "@/lib/schedule";

function asString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  // До 10 записей с одного IP за 10 минут: защита от накрутки мест.
  const limit = checkRateLimit(request, {
    scope: "booking",
    windowMs: 10 * 60 * 1000,
    max: 10,
  });

  if (limit.limited) {
    return NextResponse.json(
      { error: "Слишком много попыток. Позвоните нам, пожалуйста." },
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
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const sessionId = asString(body.sessionId, 60);
  const name = asString(body.name, 80);
  const phone = normalizePhone(asString(body.phone, 30));
  const consent = body.consent === true;

  if (!sessionId || !getSession(sessionId)) {
    return NextResponse.json({ error: "Занятие не найдено." }, { status: 404 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "Укажите имя." }, { status: 422 });
  }
  if (!phone) {
    return NextResponse.json(
      { error: "Проверьте номер телефона." },
      { status: 422 },
    );
  }
  if (!consent) {
    return NextResponse.json(
      { error: "Без согласия на обработку данных записаться нельзя." },
      { status: 422 },
    );
  }

  try {
    const userId = await readSessionUserId();
    const booking = createBooking({
      sessionId,
      name,
      phone: phone.value,
      userId,
    });
    return NextResponse.json({ ok: true, token: booking.cancelToken });
  } catch (error) {
    if (error instanceof BookingError) {
      const status = error.code === "full" ? 409 : 422;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[booking] Не удалось создать запись:", error);
    return NextResponse.json(
      { error: "Не удалось записаться. Позвоните нам, пожалуйста." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { cancelBookingByToken } from "@/lib/schedule";

/** Отмена записи по ссылке из подтверждения (обычная HTML-форма). */
export async function POST(request: Request) {
  const limit = checkRateLimit(request, {
    scope: "cancel",
    windowMs: 10 * 60 * 1000,
    max: 20,
  });

  if (limit.limited) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const form = await request.formData();
  const token = String(form.get("token") ?? "").trim();

  if (token) {
    cancelBookingByToken(token);
  }

  return NextResponse.redirect(
    new URL(`/booking/${encodeURIComponent(token)}?cancelled=1`, request.url),
    303,
  );
}

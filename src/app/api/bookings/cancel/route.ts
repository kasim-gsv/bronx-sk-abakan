import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { cancelBookingByToken } from "@/lib/schedule";
import { publicUrl } from "@/lib/url";

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
    publicUrl(
      request,
      `/booking/${encodeURIComponent(token)}?cancelled=1`,
    ),
    303,
  );
}

import { NextResponse } from "next/server";
import {
  createSessionToken,
  isDevLoginEnabled,
  sessionCookieOptions,
} from "@/lib/auth";
import { getOrCreateDevUser } from "@/lib/db";
import { publicUrl } from "@/lib/url";

/**
 * Локальный вход без Telegram. Нужен, чтобы проверять кабинет до того, как
 * клуб зарегистрирует бота и приложение Telegram Login.
 */
export async function POST(request: Request) {
  if (!isDevLoginEnabled()) {
    return NextResponse.json(
      { error: "Вход в тестовом режиме выключен." },
      { status: 403 },
    );
  }

  const user = getOrCreateDevUser();
  const token = await createSessionToken(user.id, user.role);

  const response = NextResponse.redirect(publicUrl(request, "/account"), 303);
  response.cookies.set({ ...sessionCookieOptions(), value: token });
  return response;
}

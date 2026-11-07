import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { getUserById, type User } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session-token";
import { getSessionSecret } from "@/lib/session-secret";

export {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session-token";

/** Текущий пользователь из базы (полные данные, включая роль). */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return typeof payload.sub === "string" ? getUserById(payload.sub) : null;
  } catch {
    return null;
  }
}

export async function readSessionUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export function isDevLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_LOGIN === "1"
  );
}

export function isTelegramLoginConfigured() {
  return Boolean(
    process.env.TELEGRAM_LOGIN_CLIENT_ID &&
      process.env.TELEGRAM_LOGIN_CLIENT_SECRET,
  );
}

/**
 * Доступ в админку. Основная проверка — в proxy (до рендера), здесь она
 * дублируется для серверных действий, которые можно вызвать напрямую.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/account");
  if (user.role !== "ADMIN") notFound();
  return user;
}

/** Telegram ID, которым при входе выдаётся роль администратора. */
export function adminTelegramIds(): string[] {
  return (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

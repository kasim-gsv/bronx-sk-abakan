import { jwtVerify, SignJWT } from "jose";
import { getSessionSecret } from "@/lib/session-secret";

/**
 * Работа с подписанным токеном сессии. Модуль намеренно не импортирует
 * next/headers и базу: его использует proxy, который выполняется до рендера.
 */

export const SESSION_COOKIE = "bronx_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

export type SessionRole = "STUDENT" | "ADMIN";

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function createSessionToken(
  userId: string,
  role: SessionRole = "STUDENT",
) {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());
}

/**
 * Проверка токена без обращения к базе. Роль берётся из подписанного токена:
 * если права изменили, пользователю нужно войти заново.
 */
export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (typeof payload.sub !== "string") return null;
    return {
      userId: payload.sub,
      role: (payload.role === "ADMIN" ? "ADMIN" : "STUDENT") as SessionRole,
    };
  } catch {
    return null;
  }
}

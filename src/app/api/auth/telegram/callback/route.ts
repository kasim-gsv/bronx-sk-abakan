import { createRemoteJWKSet, jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import {
  adminTelegramIds,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { getUserById, upsertTelegramUser } from "@/lib/db";
import { setUserRole } from "@/lib/schedule";

const ISSUER = "https://oauth.telegram.org";
const JWKS = createRemoteJWKSet(
  new URL("https://oauth.telegram.org/.well-known/jwks.json"),
);

type TelegramClaims = {
  sub?: string;
  id?: number;
  name?: string;
  preferred_username?: string;
  phone_number?: string;
};

function fail(request: NextRequest, code: string) {
  const url = new URL("/account", request.url);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url, 303);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const clientId = process.env.TELEGRAM_LOGIN_CLIENT_ID;
  const clientSecret = process.env.TELEGRAM_LOGIN_CLIENT_SECRET;

  if (error) return fail(request, error);
  if (!clientId || !clientSecret) return fail(request, "not_configured");
  if (!code || !state) return fail(request, "missing_code");

  const cookieState = request.cookies.get("bronx_oidc_state")?.value;
  if (!cookieState || cookieState !== state) {
    return fail(request, "state_mismatch");
  }

  const verifier = request.cookies.get("bronx_oidc_verifier")?.value;
  const redirectUri =
    request.cookies.get("bronx_oidc_redirect")?.value ??
    new URL("/api/auth/telegram/callback", request.url).toString();

  if (!verifier) return fail(request, "missing_verifier");

  let idToken: string;
  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const tokenResponse = await fetch("https://oauth.telegram.org/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: verifier,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      console.error("[auth] Telegram token error:", tokenResponse.status);
      return fail(request, "token_error");
    }

    const payload = (await tokenResponse.json()) as { id_token?: string };
    if (!payload.id_token) return fail(request, "no_id_token");
    idToken = payload.id_token;
  } catch (fetchError) {
    console.error("[auth] Telegram token request failed:", fetchError);
    return fail(request, "network_error");
  }

  let claims: TelegramClaims;
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: ISSUER,
      audience: clientId,
    });
    claims = payload as TelegramClaims;
  } catch (verifyError) {
    console.error("[auth] ID token verification failed:", verifyError);
    return fail(request, "invalid_token");
  }

  const telegramId = claims.sub ?? (claims.id ? String(claims.id) : null);
  if (!telegramId) return fail(request, "no_subject");

  const name =
    claims.name?.trim() ||
    (claims.preferred_username ? `@${claims.preferred_username}` : "") ||
    "Ученик клуба";

  const user = upsertTelegramUser({
    telegramId,
    name,
    phone: claims.phone_number ? `+${claims.phone_number}` : null,
  });

  // Список из ADMIN_TELEGRAM_IDS автоматически получает доступ в админку.
  if (adminTelegramIds().includes(telegramId)) {
    setUserRole(user.id, "ADMIN");
  }

  const finalUser = getUserById(user.id) ?? user;
  const token = await createSessionToken(finalUser.id, finalUser.role);
  const response = NextResponse.redirect(new URL("/account", request.url), 303);
  response.cookies.set({ ...sessionCookieOptions(), value: token });

  for (const name of [
    "bronx_oidc_state",
    "bronx_oidc_verifier",
    "bronx_oidc_redirect",
  ]) {
    response.cookies.set({ name, value: "", maxAge: 0, path: "/" });
  }

  return response;
}

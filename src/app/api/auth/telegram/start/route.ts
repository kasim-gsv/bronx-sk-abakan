import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isTelegramLoginConfigured } from "@/lib/auth";

/**
 * Шаг 1 входа через Telegram: Authorization Code + PKCE.
 * Документация: https://core.telegram.org/widgets/login (раздел OpenID Connect)
 */
export async function GET(request: Request) {
  const clientId = process.env.TELEGRAM_LOGIN_CLIENT_ID;

  if (!isTelegramLoginConfigured() || !clientId) {
    return NextResponse.json(
      {
        error:
          "Вход через Telegram не настроен: нужны TELEGRAM_LOGIN_CLIENT_ID и TELEGRAM_LOGIN_CLIENT_SECRET.",
      },
      { status: 503 },
    );
  }

  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");

  const redirectUri =
    process.env.TELEGRAM_LOGIN_REDIRECT_URI ??
    new URL("/api/auth/telegram/callback", request.url).toString();

  const authorizeUrl = new URL("https://oauth.telegram.org/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid profile phone");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };

  response.cookies.set({ ...common, name: "bronx_oidc_state", value: state });
  response.cookies.set({
    ...common,
    name: "bronx_oidc_verifier",
    value: verifier,
  });
  response.cookies.set({
    ...common,
    name: "bronx_oidc_redirect",
    value: redirectUri,
  });

  return response;
}

/**
 * Ключ подписи сессионных токенов. Отдельный модуль, чтобы им могли
 * пользоваться и proxy, и работа с сессией, не импортируя лишнего.
 */
export function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[auth] AUTH_SECRET не задан (или короче 32 символов) — используется ключ разработки.",
    );
    return new TextEncoder().encode(
      "dev-only-insecure-secret-for-local-development",
    );
  }

  throw new Error(
    "AUTH_SECRET не задан. Добавьте случайную строку (32+ символа) в .env.local",
  );
}

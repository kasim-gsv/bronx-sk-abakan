/**
 * Публичный адрес для редиректов и OAuth-колбэков.
 *
 * За прокси (Render, Vercel, nginx) `request.url` содержит внутренний адрес
 * вида http://localhost:10000, поэтому строить ссылки от него нельзя.
 * Порядок: настроенный NEXT_PUBLIC_SITE_URL → заголовки прокси → request.url.
 */
export function publicUrl(request: Request, path = "/") {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) {
    return new URL(path, `${configured}/`);
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";

  if (host) {
    return new URL(path, `${proto}://${host}`);
  }

  return new URL(path, request.url);
}

/**
 * Простое ограничение частоты запросов в памяти процесса.
 *
 * Ограничения подхода: счётчики живут в одном инстансе и сбрасываются при
 * перезапуске, а `x-forwarded-for` можно подделать, если перед приложением
 * нет доверенного прокси. Для клуба этого достаточно: цель — отсечь
 * примитивный флуд, а не выстроить полноценный rate limiting.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  request: Request,
  options: { scope: string; windowMs: number; max: number },
) {
  const key = `${options.scope}:${getClientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > options.max) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  // Не даём карте расти бесконечно (например, при переборе адресов).
  if (buckets.size > MAX_KEYS) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  return { limited: false, retryAfterSeconds: 0 };
}

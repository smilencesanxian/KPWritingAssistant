// Simple in-memory sliding-window rate limiter.
// Works per Node.js process. Suitable for self-hosted / dev environments.
const requestLog = new Map<string, number[]>();

/**
 * Check and record a request. Returns true if allowed, false if rate-limited.
 * @param key      Unique key, e.g. `userId:endpoint`
 * @param max      Max requests per window (default 3)
 * @param windowMs Window size in ms (default 60 000)
 */
export function checkRateLimit(
  key: string,
  max = 3,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter(
    (t) => now - t < windowMs
  );
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length <= max;
}

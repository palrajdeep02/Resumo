interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiter.
// NOTE: This must be swapped for Redis (e.g. Upstash Redis or @upstash/ratelimit) in production
// to ensure limits are shared across multiple serverless server instances.
const limiterMap = new Map<string, RateLimitRecord>();

const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window

export function isRateLimited(
  userId: string,
  apiType: string
): { limited: boolean; remaining: number; resetTime: number } {
  const key = `${userId}:${apiType}`;
  const now = Date.now();
  const record = limiterMap.get(key);

  if (!record) {
    const newRecord = { count: 1, resetTime: now + WINDOW_MS };
    limiterMap.set(key, newRecord);
    return { limited: false, remaining: LIMIT - 1, resetTime: newRecord.resetTime };
  }

  // If window reset time has passed, start a new window
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
    return { limited: false, remaining: LIMIT - 1, resetTime: record.resetTime };
  }

  // If rate limit has been hit
  if (record.count >= LIMIT) {
    return { limited: true, remaining: 0, resetTime: record.resetTime };
  }

  // Otherwise increment and return status
  record.count += 1;
  return { limited: false, remaining: LIMIT - record.count, resetTime: record.resetTime };
}

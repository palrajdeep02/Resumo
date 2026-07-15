interface RateLimitRecord {
  count: number
  resetTime: number
}

const cache = new Map<string, RateLimitRecord>()

/**
 * Basic in-memory rate limiter.
 * @param key Unique identifier (e.g. user IP, email address, API route)
 * @param limit Maximum number of requests allowed within window
 * @param windowMs Time window in milliseconds (default: 1 hour = 3600000ms)
 */
export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 3600000
): { success: boolean; limit: number; remaining: number } {
  const now = Date.now()
  const record = cache.get(key)

  if (!record) {
    cache.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, limit, remaining: limit - 1 }
  }

  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + windowMs
    return { success: true, limit, remaining: limit - 1 }
  }

  record.count++
  const remaining = Math.max(0, limit - record.count)

  if (record.count > limit) {
    return { success: false, limit, remaining }
  }

  return { success: true, limit, remaining }
}

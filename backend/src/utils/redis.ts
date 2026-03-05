/**
 * Redis client for caching. Optional: if REDIS_URL is not set, cache is no-op.
 */

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
const CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

let client: Redis | null = null;

function getClient(): Redis | null {
  if (!REDIS_URL?.trim()) return null;
  if (!client) {
    try {
      client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
        lazyConnect: true,
      });
    } catch {
      return null;
    }
  }
  return client;
}

export function isRedisAvailable(): boolean {
  return !!REDIS_URL?.trim();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const raw = await c.get(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    const serialized = JSON.stringify(value);
    await c.setex(key, ttlSeconds, serialized);
  } catch {
    // ignore
  }
}

export async function cacheDel(key: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.del(key);
  } catch {
    // ignore
  }
}

export async function cacheDelPattern(prefix: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    const keys = await c.keys(`${prefix}*`);
    if (keys.length > 0) await c.del(...keys);
  } catch {
    // ignore
  }
}

/** Get or compute and cache. */
export async function cacheGetOrSet<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await fn();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

/** Get Redis connection for BullMQ (same client). Returns null if Redis not configured. */
export function getRedisConnection(): Redis | null {
  return getClient();
}

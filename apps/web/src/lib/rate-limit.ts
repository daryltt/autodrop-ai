/**
 * In-memory rate limiter for authentication endpoints.
 *
 * **Limitations:** the store lives in Node.js process memory.  It resets on
 * every process restart and is NOT shared across multiple server instances
 * (e.g., a multi-replica deployment or serverless cold starts).
 *
 * This is intentional and acceptable for single-instance self-hosting (the
 * primary deployment target for Phase 1).  A clean seam (`RateLimitStore`)
 * is provided below so a shared backend (e.g., Redis via `ioredis`) can be
 * dropped in during a later phase without touching call-sites.
 */
import type { NextRequest } from "next/server";

export type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Pluggable storage interface for the rate limiter.
 * Swap in a Redis-backed implementation in a later phase if needed.
 */
export interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
}

/** Default in-memory store — persisted on `globalThis` to survive HMR reloads. */
const globalRateLimitStore = globalThis as typeof globalThis & {
  __autodropRateLimitStore?: Map<string, RateLimitEntry>;
};

const defaultStore: RateLimitStore =
  globalRateLimitStore.__autodropRateLimitStore ??
  (() => {
    const map = new Map<string, RateLimitEntry>();
    globalRateLimitStore.__autodropRateLimitStore = map;
    return map;
  })();

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  store: RateLimitStore = defaultStore
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs
    };
    store.set(key, nextEntry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: nextEntry.resetAt
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt
  };
}

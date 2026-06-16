import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const globalRateLimitStore = globalThis as typeof globalThis & {
  __autodropRateLimitStore?: Map<string, RateLimitEntry>;
};

const store = globalRateLimitStore.__autodropRateLimitStore ?? new Map<string, RateLimitEntry>();
globalRateLimitStore.__autodropRateLimitStore = store;

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
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

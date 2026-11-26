/**
 * In-memory sliding window rate limiter.
 *
 * ⚠️ IMPORTANT: This is a per-process rate limiter. In a serverless or
 * multi-instance deployment, each process maintains its own state.
 * For production, rely on Cloudflare WAF rate limiting rules as the
 * primary defense (see CLOUDFLARE-SETUP.md).
 *
 * This module provides a lightweight fallback for:
 * - Local development
 * - Single-instance deployments
 * - Defense-in-depth layering behind Cloudflare
 */

export interface RateLimitEntry {
  timestamps: number[];
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  reset: number;
}

// Global store — persists across requests within the same process
const store = new Map<string, RateLimitEntry>();

// Cleanup interval: purge expired entries every 60 seconds
const CLEANUP_INTERVAL_MS = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup(windowMs: number): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // Remove timestamps older than the largest window we've seen
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow the Node.js process to exit even if the timer is still running
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check and record a rate limit hit for the given identifier.
 *
 * @param identifier - Unique key (typically client IP)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult with success, remaining count, and reset timestamp
 *
 * @example
 * ```ts
 * const result = rateLimit("192.168.1.1", 30, 60_000); // 30 req/min
 * if (!result.success) {
 *   return new Response("Too Many Requests", { status: 429 });
 * }
 * ```
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Ensure cleanup is running
  startCleanup(windowMs);

  // Get or create entry for this identifier
  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Slide the window: remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  // Calculate reset time based on oldest timestamp in window
  const oldestInWindow = entry.timestamps[0] ?? now;
  const reset = oldestInWindow + windowMs;

  // Check if rate limit exceeded
  if (entry.timestamps.length >= limit) {
    return {
      success: false,
      remaining: 0,
      reset,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    success: true,
    remaining: limit - entry.timestamps.length,
    reset,
  };
}

/**
 * Reset rate limit state for a specific identifier.
 * Useful for testing or administrative overrides.
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}

/**
 * Clear all rate limit state.
 * Useful for testing teardown.
 */
export function resetAllRateLimits(): void {
  store.clear();
}

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Sliding-window rate limiting, applied at the top of the write endpoints
// most worth protecting (comments, reviews, the social toggles, signup) —
// see SECURITY_AUDIT_2026-07-14.md's Phase 6. This is defense-in-depth
// against spam and free-tier quota burn, NOT an auth gate: ownership/auth
// checks still live in each handler and are what actually protect data.
//
// Two deliberate "fail open" cases, both returning { ok: true } (allow):
//   1. Upstash isn't configured (no env vars) — e.g. local dev, or before
//      the Upstash project is provisioned. The whole feature is inert until
//      UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, so this
//      code can ship and sit dormant with zero behavior change.
//   2. Upstash is configured but unreachable at request time. A Redis
//      outage must never take down the ability to post a comment — the
//      protection lapsing is a better failure than blocking real users.

const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis.fromEnv() throws when the env vars are absent, so only build it when
// configured. One client is shared across every limiter below.
const redis = hasUpstashConfig ? Redis.fromEnv() : null;

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

// `prefix` namespaces each limiter's Redis keys so limits never collide —
// hitting your comment limit doesn't touch your follow limit.
function makeLimiter(prefix: string, tokens: number, window: Window) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `rl:${prefix}`,
    // Off by default — analytics adds an extra Redis write per request, which
    // is exactly the cost this is meant to bound. Flip on later if wanted.
    analytics: false,
  });
}

// Starting limits — intentionally generous so a normal user never trips them;
// tune down if abuse shows up. Comments are the tightest (top spam vector,
// no moderation UI yet); the social toggles are loose since real users click
// around. Keyed by user id for authenticated routes, by IP for signup.
const limiters = {
  comment: makeLimiter("comment", 5, "1 m"),
  review: makeLimiter("review", 10, "1 m"),
  social: makeLimiter("social", 30, "1 m"),
  signup: makeLimiter("signup", 5, "1 h"),
};

export type RateLimiterName = keyof typeof limiters;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export async function checkRateLimit(
  name: RateLimiterName,
  key: string
): Promise<RateLimitResult> {
  const limiter = limiters[name];
  if (!limiter) return { ok: true }; // unconfigured → fail open (case 1 above)

  try {
    const { success, reset } = await limiter.limit(key);
    if (success) return { ok: true };
    // `reset` is a ms epoch timestamp for when the window frees up; convert
    // to a whole-second Retry-After, floored at 1.
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch {
    return { ok: true }; // Upstash unreachable → fail open (case 2 above)
  }
}

// Best-effort client IP for IP-keyed limits (signup). x-forwarded-for is set
// by Vercel's proxy; the first entry is the original client. Imperfect (shared
// NATs, easily rotated behind proxies) but it's the only handle pre-auth.
export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Standard 429 for the API routes — the friendly copy here is what the
// frontend surfaces (see comment-thread / review-section error handling).
export function tooManyRequestsResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "You're doing that too fast — wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

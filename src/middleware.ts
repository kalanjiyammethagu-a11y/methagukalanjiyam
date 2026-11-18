import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Extract the real client IP address.
 * Priority: CF-Connecting-IP → X-Forwarded-For (first IP) → x-real-ip → request.ip → fallback
 */
function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback to request.ip if present on the request object
  const reqWithIp = request as unknown as { ip?: string };
  if (reqWithIp.ip) return reqWithIp.ip;

  return "unknown";
}

/**
 * Rate limiting rules:
 * - /login: 10 requests per minute per IP
 * - /api/orders/*: 30 requests per minute per IP
 * - /api/webhooks/*: 60 requests per minute per IP
 */
interface RateLimitRule {
  prefix: string;
  matches: (pathname: string) => boolean;
  limit: number;
  windowMs: number;
}

const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    prefix: "admin-login",
    matches: (pathname) =>
      pathname === "/admin/login" ||
      pathname === "/api/auth/admin/login",
    limit: 5,
    windowMs: 60_000,
  },
  {
    prefix: "admin-otp",
    matches: (pathname) =>
      pathname === "/api/auth/admin/verify-otp" ||
      pathname === "/api/auth/admin/resend-otp",
    limit: 5,
    windowMs: 60_000,
  },
  {
    prefix: "signup",
    matches: (pathname) =>
      pathname === "/signup" ||
      pathname === "/api/auth/signup",
    limit: 5,
    windowMs: 60_000,
  },
  {
    prefix: "resend-verify",
    matches: (pathname) => pathname === "/api/auth/resend-verification",
    limit: 3,
    windowMs: 60_000,
  },
  {
    prefix: "login",
    matches: (pathname) =>
      pathname === "/login" ||
      pathname === "/api/auth/login",
    limit: 10,
    windowMs: 60_000,
  },
  {
    prefix: "api-orders",
    matches: (pathname) => pathname.startsWith("/api/orders"),
    limit: 30,
    windowMs: 60_000,
  },
  {
    prefix: "api-webhooks",
    matches: (pathname) => pathname.startsWith("/api/webhooks"),
    limit: 60,
    windowMs: 60_000,
  },
];

function applyCacheHeaders(response: NextResponse, pathname: string): NextResponse {
  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/api")
  ) {
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, max-age=0, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    if (pathname.startsWith("/admin")) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }

    if (!pathname.startsWith("/api")) {
      response.headers.set("Vary", "Cookie, Authorization, Accept-Encoding");
    }
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Strict CSRF verification on state-changing API endpoints
  if (
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method) &&
    (pathname.startsWith("/api/orders") || pathname.startsWith("/api/auth"))
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            {
              error: "Forbidden: CSRF check failed",
              message: "Cross-site requests to this API endpoint are not permitted.",
            },
            {
              status: 403,
              headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
              },
            }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Forbidden: Malformed Origin header" },
          { status: 403, headers: { "Cache-Control": "no-store" } }
        );
      }
    }
  }

  // 2. Maintain existing session management first
  const sessionResponse = await updateSession(request);

  // If updateSession already returned a redirect response (e.g. unauthenticated /admin),
  // honor it immediately and apply cache headers
  if (sessionResponse && sessionResponse.status >= 300 && sessionResponse.status < 400) {
    return applyCacheHeaders(sessionResponse, pathname);
  }

  // 3. Perform rate limiting checks after session update
  const clientIp = getClientIp(request);

  for (const rule of RATE_LIMIT_RULES) {
    if (rule.matches(pathname)) {
      const identifier = `${rule.prefix}:${clientIp}`;
      const result = rateLimit(identifier, rule.limit, rule.windowMs);

      if (!result.success) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000)
        );
        const rateLimitResponse = NextResponse.json(
          {
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: retryAfterSeconds,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfterSeconds),
              "X-RateLimit-Limit": String(rule.limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(result.reset),
            },
          }
        );
        return applyCacheHeaders(rateLimitResponse, pathname);
      }

      // If allowed, append rate limit info headers to session response
      if (sessionResponse) {
        sessionResponse.headers.set("X-RateLimit-Limit", String(rule.limit));
        sessionResponse.headers.set(
          "X-RateLimit-Remaining",
          String(result.remaining)
        );
        sessionResponse.headers.set(
          "X-RateLimit-Reset",
          String(result.reset)
        );
      }
      return applyCacheHeaders(sessionResponse, pathname);
    }
  }

  // No rate limit rule matched — proceed with session update response
  return applyCacheHeaders(sessionResponse, pathname);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, jpeg, webp, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

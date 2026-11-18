/**
 * Cloudflare utilities for the Tamil bookstore (methagukalanjiyam.in).
 *
 * Provides:
 * - Real client IP extraction (for Cloudflare-proxied requests)
 * - Turnstile CAPTCHA server-side token verification
 */

/**
 * Extract the real client IP from Cloudflare request headers.
 *
 * When behind Cloudflare's proxy, the original client IP is in
 * the `CF-Connecting-IP` header. Falls back through standard proxy
 * headers for non-Cloudflare environments (e.g., local dev).
 *
 * @param source - Request headers (Headers, Request, NextRequest, or object with get())
 * @returns The client IP address, or 'unknown' if not determinable
 */
export function getClientIp(
  source:
    | Headers
    | Request
    | { headers?: Headers | { get(name: string): string | null }; get?: (name: string) => string | null }
): string {
  let headers: { get(name: string): string | null } | undefined;

  if ("headers" in source && source.headers && typeof (source.headers as { get?: unknown }).get === "function") {
    headers = source.headers as { get(name: string): string | null };
  } else if (typeof (source as { get?: unknown }).get === "function") {
    headers = source as { get(name: string): string | null };
  }

  if (!headers) {
    return "unknown";
  }

  // 1. Cloudflare's own header — most reliable when behind CF proxy
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // 2. Standard proxy header (first IP is the original client)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  // 3. Nginx / reverse proxy header
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // 4. NextRequest / Express socket fallback if available
  if ("ip" in source && typeof (source as { ip?: unknown }).ip === "string") {
    return (source as { ip: string }).ip;
  }

  return "unknown";
}

/**
 * Cloudflare Turnstile verification response schema.
 */
export interface TurnstileVerifyResponse {
  /** Whether the token was valid */
  success: boolean;
  /** ISO timestamp of the challenge solve */
  challenge_ts?: string;
  /** Hostname the challenge was solved on */
  hostname?: string;
  /** List of error codes if verification failed */
  "error-codes"?: string[];
  /** Action name from the widget (if configured) */
  action?: string;
  /** Custom data passed to the widget (if configured) */
  cdata?: string;
}

export interface TurnstileVerifyResult {
  /** Whether the Turnstile token is valid */
  success: boolean;
  /** Error message if verification failed */
  error?: string;
  /** Raw response object from Cloudflare */
  response: TurnstileVerifyResponse;
}

/**
 * Verify a Cloudflare Turnstile token server-side.
 *
 * Call this in your API route, server action, or checkout handler after
 * receiving the Turnstile token from the client-side widget.
 *
 * @param token - The `cf-turnstile-response` token from the client widget
 * @param ip - Optional client IP for additional verification
 * @returns Verification result with success status, error details, and raw response
 *
 * @example
 * ```ts
 * const result = await verifyTurnstileToken(turnstileToken, clientIp);
 * if (!result.success) {
 *   return NextResponse.json({ error: "Turnstile verification failed" }, { status: 403 });
 * }
 * ```
 *
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error(
      "[Turnstile] CLOUDFLARE_TURNSTILE_SECRET_KEY is not set in environment variables"
    );
    return {
      success: false,
      error: "Turnstile secret key not configured",
      response: { success: false, "error-codes": ["missing-secret"] },
    };
  }

  if (!token) {
    return {
      success: false,
      error: "No Turnstile token provided",
      response: { success: false, "error-codes": ["missing-input-response"] },
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip && ip !== "unknown") {
      formData.append("remoteip", ip);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!res.ok) {
      return {
        success: false,
        error: `Turnstile API returned HTTP ${res.status}`,
        response: {
          success: false,
          "error-codes": [`http-${res.status}`],
        },
      };
    }

    const data: TurnstileVerifyResponse = await res.json();

    if (!data.success) {
      const errorCodes = data["error-codes"] ?? [];
      return {
        success: false,
        error: `Turnstile verification failed: ${errorCodes.join(", ") || "unknown error"}`,
        response: data,
      };
    }

    return {
      success: true,
      response: data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Turnstile] Verification request failed:", message);
    return {
      success: false,
      error: `Turnstile verification request failed: ${message}`,
      response: { success: false, "error-codes": ["network-error"] },
    };
  }
}

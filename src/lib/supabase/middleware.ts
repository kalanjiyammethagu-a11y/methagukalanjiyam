import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

async function verifyEdgeToken(signedToken: string): Promise<boolean> {
  const parts = signedToken.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [payload, signature] = parts;
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    return await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
    // If Supabase credentials are missing or placeholder, proceed without session lookup
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<typeof supabaseResponse.cookies.set>[2];
          }>
        ) {
          const isProduction = process.env.NODE_ENV === "production";
          const isHttps =
            request.headers.get("x-forwarded-proto") === "https" ||
            request.nextUrl.protocol === "https:";
          const isSecure = isProduction || isHttps;

          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: options?.path || "/",
              sameSite: (options?.sameSite as any) || "lax",
              httpOnly: options?.httpOnly ?? true,
              secure: isSecure,
            })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Strict Two-Step Verification RBAC for /admin routes
  if (pathname.startsWith("/admin")) {
    // Whitelist dedicated admin login gate
    if (pathname === "/admin/login") {
      return supabaseResponse;
    }

    // Require verified two-step admin session cookie
    const adminSessionToken = request.cookies.get("mk_admin_session")?.value;
    if (!adminSessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // Cryptographic HMAC signature check (protects against cookie forgery)
    const isValidSignature = await verifyEdgeToken(adminSessionToken);
    if (!isValidSignature) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      const redirectRes = NextResponse.redirect(url);
      redirectRes.cookies.set("mk_admin_session", "", { path: "/", maxAge: 0 });
      return redirectRes;
    }
  }

  // 2. Route protection for /account
  if (pathname.startsWith("/account")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

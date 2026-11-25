import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { userSignInSchema } from "@/lib/validators/auth";
import { recordAuthEvent } from "@/lib/auth-service";
import { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = userSignInSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || null;

    const response = NextResponse.json(
      { success: true, message: "Logged in successfully." },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: isProduction,
              sameSite: "lax",
              path: "/",
            });
          });
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.user) {
      await recordAuthEvent({
        email: normalizedEmail,
        eventType: "user_login_failed",
        ipAddress: clientIp,
        userAgent,
      });

      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // Strict email verification enforcement: user must have confirmed email AND verified via Resend
    const isVerified =
      Boolean(authData.user.email_confirmed_at) &&
      authData.user.user_metadata?.email_verified !== false;

    if (!isVerified) {
      await supabase.auth.signOut();

      const clearedCookies = response.cookies.getAll();
      const unverifiedRes = NextResponse.json(
        {
          error: "email_unverified",
          canResend: true,
          message:
            "Your email address has not been verified yet. Please check your inbox for the verification link or request a new one.",
        },
        { status: 403 }
      );

      for (const cookie of clearedCookies) {
        if (cookie.name.startsWith("sb-") || cookie.name.includes("auth-token")) {
          unverifiedRes.cookies.set(cookie.name, "", {
            path: "/",
            maxAge: 0,
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
          });
        }
      }

      await recordAuthEvent({
        userId: authData.user.id,
        email: normalizedEmail,
        eventType: "user_login_blocked_unverified",
        ipAddress: clientIp,
        userAgent,
      });

      return unverifiedRes;
    }

    await recordAuthEvent({
      userId: authData.user.id,
      email: normalizedEmail,
      eventType: "user_login_success",
      ipAddress: clientIp,
      userAgent,
    });

    return response;
  } catch (error: any) {
    console.error("API /api/auth/login exception:", error?.message);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}

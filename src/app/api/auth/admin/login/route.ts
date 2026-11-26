import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminLoginStep1Schema } from "@/lib/validators/auth";
import { createAdminSession, issueAdminOtp, recordAuthEvent } from "@/lib/auth-service";
import { sendAdminOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

async function equalizeTiming(startTime: number, minMs = 450) {
  const elapsed = Date.now() - startTime;
  if (elapsed < minMs) {
    await new Promise((r) => setTimeout(r, minMs - elapsed));
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    const parseResult = adminLoginStep1Schema.safeParse(body);
    if (!parseResult.success) {
      await equalizeTiming(startTime);
      return NextResponse.json(
        {
          error: "Invalid login data",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "admin-login";
    const isProduction = process.env.NODE_ENV === "production";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.user) {
      await recordAuthEvent({
        email: normalizedEmail,
        eventType: "admin_login_step1_failed",
        ipAddress: clientIp,
        userAgent,
      });

      await equalizeTiming(startTime);
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    const userId = authData.user.id;
    const adminSupabase = createAdminClient();

    // Strict admin role verification (profiles.role === 'admin')
    const { data: profile, error: profileError } = await (adminSupabase.from("profiles") as any)
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    if (profileError || !isAdmin) {
      await recordAuthEvent({
        userId,
        email: normalizedEmail,
        eventType: "admin_login_non_admin_denied",
        ipAddress: clientIp,
        userAgent,
      });

      await equalizeTiming(startTime);
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // When ADMIN_2FA_ENABLED is explicitly set to "false", issue a direct DB-backed admin session after password + role check.
    if (process.env.ADMIN_2FA_ENABLED === "false") {
      const { sessionToken } = await createAdminSession(userId, clientIp, userAgent);

      await recordAuthEvent({
        userId,
        email: normalizedEmail,
        eventType: "admin_login_direct_success",
        ipAddress: clientIp,
        userAgent,
      });

      await equalizeTiming(startTime);

      const response = NextResponse.json(
        {
          success: true,
          step: "authenticated",
          redirect: "/admin",
          message: "Authentication confirmed. Redirecting to administration console...",
        },
        { status: 200 }
      );

      response.cookies.set("mk_admin_session", sessionToken, {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        maxAge: 8 * 60 * 60,
      });

      response.cookies.set("mk_admin_preauth", "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
      });

      return response;
    }

    // Two-Factor Authentication via Resend Email OTP when ADMIN_2FA_ENABLED !== "false".
    const { preAuthToken, otpCode, expiresInMinutes } = await issueAdminOtp(
      userId,
      normalizedEmail
    );

    const emailResult = await sendAdminOtpEmail({
      to: normalizedEmail,
      otpCode,
      expiresInMinutes,
    });

    if (!emailResult.success) {
      console.error("Failed to dispatch Admin 2FA OTP email:", emailResult.error);
      await equalizeTiming(startTime);
      return NextResponse.json(
        {
          error:
            "Could not dispatch verification email. Please check your Resend email configuration.",
        },
        { status: 502 }
      );
    }

    await recordAuthEvent({
      userId,
      email: normalizedEmail,
      eventType: "admin_2fa_otp_issued",
      ipAddress: clientIp,
      userAgent,
      metadata: {
        simulated_email: emailResult.simulated || false,
        expires_in_minutes: expiresInMinutes,
      },
    });

    await equalizeTiming(startTime);

    // Mask email for UI without ever exposing OTP or raw preAuthToken in JSON
    const maskedEmail = normalizedEmail.replace(
      /(.{2})(.*)(?=@)/,
      (_, a, b) => a + "*".repeat(Math.max(2, b.length))
    );

    const response = NextResponse.json(
      {
        step: "otp",
        email: maskedEmail,
        expiresInMinutes,
        supportsBackupCode: true,
        message: "A 6-digit verification code has been dispatched to your administrator email via Resend.",
      },
      { status: 200 }
    );

    response.cookies.set("mk_admin_preauth", preAuthToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: expiresInMinutes * 60,
    });

    return response;
  } catch (error: any) {
    console.error("API /api/auth/admin/login exception:", error?.message);
    await equalizeTiming(startTime);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}

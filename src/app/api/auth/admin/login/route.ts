import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminLoginStep1Schema } from "@/lib/validators/auth";
import { issueAdminOtp, createAdminSession } from "@/lib/auth-service";
import { sendAdminOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Equalizes response timing to prevent timing-based user enumeration.
 */
async function equalizeTiming(startTime: number, minMs = 500) {
  const elapsed = Date.now() - startTime;
  if (elapsed < minMs) {
    await new Promise((r) => setTimeout(r, minMs - elapsed));
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    // 1. Strict Zod input validation
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

    // 2. Authenticate user credentials via Supabase Auth
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
      await equalizeTiming(startTime);
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    const userId = authData.user.id;
    const adminSupabase = createAdminClient();

    // 3. Authorization check: User MUST have role = 'admin'
    const { data: profile, error: profileError } = await (adminSupabase.from("profiles") as any)
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin =
      profile?.role === "admin" || authData.user.app_metadata?.role === "admin";

    if (profileError || !isAdmin) {
      // Neutral error for non-admins to avoid revealing existence of admin accounts
      await equalizeTiming(startTime);
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "admin-login";
    const isProduction = process.env.NODE_ENV === "production";

    // 4. Check if 2FA is bypassed (ADMIN_2FA_ENABLED=false in env)
    const bypass2FA = process.env.ADMIN_2FA_ENABLED === "false";

    if (bypass2FA) {
      // --- BYPASS PATH: issue full admin session directly ---
      const { sessionToken } = await createAdminSession(userId, clientIp, userAgent);

      // Audit log
      try {
        await (adminSupabase.from("audit_logs") as any).insert({
          user_id: userId,
          action: "admin_login_success_2fa_bypassed",
          resource_type: "auth",
          resource_id: userId,
          ip_address: clientIp,
          user_agent: userAgent,
          metadata: { email: normalizedEmail },
        });
      } catch (auditErr) {
        console.warn("Audit log warning on admin bypass login:", auditErr);
      }

      await equalizeTiming(startTime);

      const response = NextResponse.json(
        {
          success: true,
          redirect: "/admin",
          message: "Admin login successful (2FA bypassed).",
        },
        { status: 200 }
      );

      response.cookies.set("mk_admin_session", sessionToken, {
        path: "/admin",
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        maxAge: 8 * 60 * 60, // 8 hours
      });

      return response;
    }

    // --- FULL 2FA PATH: issue OTP and pre-auth cookie ---

    // 4. Issue Step 2 OTP (CSPRNG 6-digit code, 10 min TTL, max 5 attempts)
    const { preAuthToken, otpCode, expiresInMinutes } = await issueAdminOtp(
      userId,
      normalizedEmail
    );

    // 5. Dispatch OTP email via Resend
    const emailResult = await sendAdminOtpEmail({
      to: normalizedEmail,
      otpCode,
      expiresInMinutes,
    });

    if (!emailResult.success) {
      console.error("Failed to send Admin OTP email:", emailResult.error);
      return NextResponse.json(
        {
          error:
            "Could not dispatch verification email. Please check your email service configuration.",
        },
        { status: 502 }
      );
    }

    // 6. Log audit trail
    try {
      await (adminSupabase.from("audit_logs") as any).insert({
        user_id: userId,
        action: "admin_login_step1_success",
        resource_type: "auth",
        resource_id: userId,
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: {
          email: normalizedEmail,
          simulated_email: emailResult.simulated || false,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log warning on admin login step 1:", auditErr);
    }

    await equalizeTiming(startTime);

    // 7. Prepare response and bind pre-auth state in HttpOnly cookie
    const response = NextResponse.json(
      {
        step: "otp",
        email: normalizedEmail.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length)),
        message: "A 6-digit verification code has been dispatched to your administrator email.",
        expiresInMinutes,
        simulatedOtp: emailResult.simulated ? otpCode : undefined,
      },
      { status: 200 }
    );

    response.cookies.set("mk_admin_preauth", preAuthToken, {
      path: "/admin",
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: expiresInMinutes * 60, // 10 minutes
    });

    return response;
  } catch (error: any) {
    console.error("API /api/auth/admin/login exception:", error);
    await equalizeTiming(startTime);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}


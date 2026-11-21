export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminVerifyOtpSchema } from "@/lib/validators/auth";
import { verifyAdminOtp, createAdminSession } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const preAuthToken = req.cookies.get("mk_admin_preauth")?.value;

    if (!preAuthToken) {
      return NextResponse.json(
        {
          error: "Pre-authentication session missing or expired. Please sign in again.",
          restart: true,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = adminVerifyOtpSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid code format. Please provide a 6-digit verification code.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { otp_code } = parseResult.data;

    // Verify OTP using single-use, constant-time verification
    const verification = await verifyAdminOtp(preAuthToken, otp_code);

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;
    const adminSupabase = createAdminClient();

    if (!verification.valid) {
      // Audit failure
      try {
        await (adminSupabase.from("audit_logs") as any).insert({
          action: "admin_otp_failed",
          resource_type: "auth",
          resource_id: verification.userId || "unknown",
          ip_address: clientIp,
          user_agent: userAgent,
          metadata: {
            lockout: verification.lockout,
            attempts_left: verification.attemptsLeft,
          },
        });
      } catch (auditErr) {
        console.warn("Audit log error on OTP failure:", auditErr);
      }

      const response = NextResponse.json(
        {
          error: verification.error || "Invalid verification code.",
          attemptsLeft: verification.attemptsLeft,
          lockout: verification.lockout,
        },
        { status: verification.lockout ? 403 : 400 }
      );

      if (verification.lockout) {
        // Clear pre-auth cookie if maximum attempts exceeded
        response.cookies.set("mk_admin_preauth", "", {
          path: "/admin",
          maxAge: 0,
        });
      }

      return response;
    }

    // OTP Verified! Create full admin session
    const { sessionToken, expiresAt } = await createAdminSession(
      verification.userId!,
      clientIp,
      userAgent
    );

    // Audit success
    try {
      await (adminSupabase.from("audit_logs") as any).insert({
        user_id: verification.userId!,
        action: "admin_login_otp_success",
        resource_type: "auth",
        resource_id: verification.userId!,
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: {
          email: verification.email,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log error on OTP success:", auditErr);
    }

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json(
      {
        success: true,
        message: "Two-step authentication confirmed. Admin session granted.",
        redirect: "/admin",
      },
      { status: 200 }
    );

    // 1. Issue full admin session cookie (HttpOnly, Strict, Secure, 8-hour max)
    response.cookies.set("mk_admin_session", sessionToken, {
      path: "/admin",
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    // 2. Clear pre-auth cookie (consumed)
    response.cookies.set("mk_admin_preauth", "", {
      path: "/admin",
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
    });

    return response;
  } catch (error: any) {
    console.error("API /api/auth/admin/verify-otp exception:", error);
    return NextResponse.json(
      { error: "Internal verification error" },
      { status: 500 }
    );
  }
}


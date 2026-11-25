import { NextRequest, NextResponse } from "next/server";
import { adminStep2ChallengeSchema } from "@/lib/validators/auth";
import {
  createAdminSession,
  recordAuthEvent,
  verifyAdminBackupCode,
  verifyAdminOtp,
} from "@/lib/auth-service";

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
    const parseResult = adminStep2ChallengeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error:
            "Invalid verification format. Provide a 6-digit email code or an 8-character backup recovery code.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const parsed = parseResult.data;
    const isBackupAttempt = "backup_code" in parsed;

    const verification = isBackupAttempt
      ? await verifyAdminBackupCode(preAuthToken, parsed.backup_code)
      : await verifyAdminOtp(preAuthToken, parsed.otp_code);

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    if (!verification.valid) {
      await recordAuthEvent({
        userId: verification.userId || null,
        email: verification.email || null,
        eventType: isBackupAttempt ? "admin_2fa_backup_failed" : "admin_2fa_otp_failed",
        ipAddress: clientIp,
        userAgent,
        metadata: {
          lockout: Boolean(verification.lockout),
          attempts_left: verification.attemptsLeft,
        },
      });

      const response = NextResponse.json(
        {
          error: verification.error || "Invalid verification code.",
          attemptsLeft: verification.attemptsLeft,
          lockout: verification.lockout,
        },
        { status: verification.lockout ? 403 : 400 }
      );

      if (verification.lockout) {
        response.cookies.set("mk_admin_preauth", "", {
          path: "/",
          maxAge: 0,
        });
      }

      return response;
    }

    const { sessionToken } = await createAdminSession(
      verification.userId!,
      clientIp,
      userAgent
    );

    await recordAuthEvent({
      userId: verification.userId!,
      email: verification.email || null,
      eventType: verification.usedBackupCode
        ? "admin_2fa_backup_success"
        : "admin_2fa_otp_success",
      ipAddress: clientIp,
      userAgent,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json(
      {
        success: true,
        usedBackupCode: Boolean(verification.usedBackupCode),
        message: verification.usedBackupCode
          ? "Backup recovery code accepted (now marked used). Admin session granted."
          : "Two-step authentication confirmed. Admin session granted.",
        redirect: "/admin",
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
  } catch (error: any) {
    console.error("API /api/auth/admin/verify-otp exception:", error?.message);
    return NextResponse.json(
      { error: "Internal verification error" },
      { status: 500 }
    );
  }
}

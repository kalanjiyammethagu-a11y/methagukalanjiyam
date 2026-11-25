import { NextRequest, NextResponse } from "next/server";
import { recordAuthEvent, rotateAdminOtpChallenge } from "@/lib/auth-service";
import { sendAdminOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const preAuthToken = req.cookies.get("mk_admin_preauth")?.value;

    if (!preAuthToken) {
      return NextResponse.json(
        { error: "Verification session missing or expired. Please sign in again." },
        { status: 401 }
      );
    }

    const rotated = await rotateAdminOtpChallenge(preAuthToken);
    if (!rotated.ok || !rotated.otpCode || !rotated.email) {
      return NextResponse.json(
        {
          error: rotated.error || "Unable to resend verification code.",
          retryAfter: rotated.retryAfterSeconds,
        },
        { status: rotated.status }
      );
    }

    const emailResult = await sendAdminOtpEmail({
      to: rotated.email,
      otpCode: rotated.otpCode,
      expiresInMinutes: 10,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to dispatch verification email. Please try again." },
        { status: 502 }
      );
    }

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    await recordAuthEvent({
      userId: rotated.userId || null,
      email: rotated.email,
      eventType: "admin_2fa_otp_resent",
      ipAddress: clientIp,
      userAgent,
      metadata: { simulated_email: emailResult.simulated || false },
    });

    return NextResponse.json(
      {
        success: true,
        cooldownSeconds: 60,
        message: "A fresh 6-digit verification code has been dispatched to your email via Resend.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/auth/admin/resend-otp exception:", error?.message);
    return NextResponse.json(
      { error: "Failed to resend verification code" },
      { status: 500 }
    );
  }
}

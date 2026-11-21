import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashSecret, generateSecureOtp } from "@/lib/auth-service";
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

    const preAuthHash = hashSecret(preAuthToken);
    const adminSupabase = createAdminClient();

    // Find current active OTP record
    const { data: record, error } = await (adminSupabase.from("admin_otp_codes") as any)
      .select("*")
      .eq("pre_auth_token_hash", preAuthHash)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !record) {
      return NextResponse.json(
        { error: "No active verification session found. Please sign in again." },
        { status: 401 }
      );
    }

    // Check 60-second cooldown
    const lastSentAt = new Date(record.last_sent_at).getTime();
    const cooldownMs = 60 * 1000;
    const timeSinceLast = Date.now() - lastSentAt;

    if (timeSinceLast < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - timeSinceLast) / 1000);
      return NextResponse.json(
        {
          error: `Please wait ${waitSeconds} seconds before requesting a new code.`,
          retryAfter: waitSeconds,
        },
        { status: 429 }
      );
    }

    // Check hourly limit / max resends (max 3 resends per login session)
    if (record.resend_count >= 3) {
      return NextResponse.json(
        {
          error:
            "Maximum resend limit reached for this session. Please restart login from Step 1.",
        },
        { status: 429 }
      );
    }

    // Generate new OTP
    const newOtpCode = generateSecureOtp();
    const newHashedCode = hashSecret(newOtpCode);
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await (adminSupabase.from("admin_otp_codes") as any)
      .update({
        hashed_code: newHashedCode,
        resend_count: record.resend_count + 1,
        attempts: 0, // Reset attempts on fresh code
        last_sent_at: new Date().toISOString(),
        expires_at: newExpiresAt,
      })
      .eq("id", record.id);

    // Send email
    const emailResult = await sendAdminOtpEmail({
      to: record.email,
      otpCode: newOtpCode,
      expiresInMinutes: 10,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to dispatch verification email. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "A new 6-digit verification code has been dispatched to your email.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/auth/admin/resend-otp exception:", error);
    return NextResponse.json(
      { error: "Internal error processing code resend" },
      { status: 500 }
    );
  }
}


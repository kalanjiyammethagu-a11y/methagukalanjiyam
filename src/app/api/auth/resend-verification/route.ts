import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resendVerificationSchema } from "@/lib/validators/auth";
import { issueUserVerificationToken, recordAuthEvent } from "@/lib/auth-service";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const COOLDOWN_SECONDS = 60;

function resolvePublicAppUrl(req: NextRequest): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.startsWith("http")) {
    return configured.replace(/\/$/, "");
  }
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = resendVerificationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();
    const adminSupabase = createAdminClient();
    const appUrl = resolvePublicAppUrl(req);
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || null;

    const { data: userList } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const user = userList?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (
      user &&
      (!user.email_confirmed_at || user.user_metadata?.email_verified === false)
    ) {
      const outcome = await issueUserVerificationToken(
        user.id,
        normalizedEmail,
        COOLDOWN_SECONDS
      );

      if (outcome.issued && outcome.rawToken) {
        const verifyUrl = `${appUrl}/verify-email?token=${outcome.rawToken}`;
        const name = (user.user_metadata?.full_name as string) || "வாசகரே";

        const mailResult = await sendVerificationEmail({
          to: normalizedEmail,
          name,
          verifyUrl,
        });

        await recordAuthEvent({
          userId: user.id,
          email: normalizedEmail,
          eventType: "user_verification_email_resent",
          ipAddress: clientIp,
          userAgent,
          metadata: { email_sent: mailResult.success },
        });
      }
    }

    // Zero enumeration: return uniform neutral 200 regardless of account existence, state, or per-user cooldown
    return NextResponse.json(
      {
        success: true,
        cooldownSeconds: COOLDOWN_SECONDS,
        message:
          "If your account is registered and pending verification, a confirmation link has been sent to your inbox.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/auth/resend-verification exception:", error?.message);
    return NextResponse.json(
      { error: "Failed to process verification email request" },
      { status: 500 }
    );
  }
}

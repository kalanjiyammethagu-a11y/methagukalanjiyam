export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resendVerificationSchema } from "@/lib/validators/auth";
import { issueUserVerificationToken } from "@/lib/auth-service";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

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

    // Check if user exists and is unverified
    const { data: userList } = await adminSupabase.auth.admin.listUsers();
    const user = userList?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);

    if (user && !user.email_confirmed_at) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";

      const rawToken = await issueUserVerificationToken(user.id, normalizedEmail);
      const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
      const name = (user.user_metadata?.full_name as string) || "வாசகரே";

      await sendVerificationEmail({
        to: normalizedEmail,
        name,
        verifyUrl,
      });
    }

    // Always return neutral response (zero enumeration)
    return NextResponse.json(
      {
        success: true,
        message:
          "If your account is registered and pending confirmation, a fresh verification link has been dispatched.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/auth/resend-verification exception:", error);
    return NextResponse.json(
      { error: "Failed to resend confirmation email" },
      { status: 500 }
    );
  }
}


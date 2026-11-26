import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { userSignUpSchema } from "@/lib/validators/auth";
import {
  findAuthUserByEmail,
  issueUserVerificationToken,
  recordAuthEvent,
} from "@/lib/auth-service";
import { sendVerificationEmail, sendAlreadyRegisteredEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

async function equalizeTiming(startTime: number, minMs = 450) {
  const elapsed = Date.now() - startTime;
  if (elapsed < minMs) {
    await new Promise((r) => setTimeout(r, minMs - elapsed));
  }
}

function resolvePublicAppUrl(req: NextRequest): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.startsWith("http")) {
    return configured.replace(/\/$/, "");
  }
  return req.nextUrl.origin;
}

const NEUTRAL_SIGNUP_MESSAGE =
  "If your email address is eligible, a verification link has been sent to your inbox. Please verify your email before signing in.";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      await equalizeTiming(startTime);
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const parseResult = userSignUpSchema.safeParse(body);
    if (!parseResult.success) {
      await equalizeTiming(startTime);
      return NextResponse.json(
        {
          error: "Invalid registration data",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password, full_name, locale } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();
    const adminSupabase = createAdminClient();
    const appUrl = resolvePublicAppUrl(req);
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || null;

    // 1. Check if account already exists (RPC / paginated lookup across all auth.users pages)
    const existingUser = await findAuthUserByEmail(adminSupabase, normalizedEmail);

    if (existingUser) {
      const isAlreadyVerified =
        Boolean(existingUser.email_confirmed_at) &&
        existingUser.user_metadata?.email_verified !== false;

      if (!isAlreadyVerified) {
        // Account exists but hasn't verified email yet: resend verification respecting 60s cooldown
        try {
          const outcome = await issueUserVerificationToken(
            existingUser.id,
            normalizedEmail,
            60
          );
          if (outcome.issued && outcome.rawToken) {
            const verifyUrl = `${appUrl}/verify-email?token=${outcome.rawToken}`;
            await sendVerificationEmail({
              to: normalizedEmail,
              name: (existingUser.user_metadata?.full_name as string) || full_name,
              verifyUrl,
            });
          }
        } catch (resendErr: any) {
          console.warn("Pending account verification resend warning:", resendErr?.message);
        }
      } else {
        // Confirmed account already exists: email owner securely without exposing account existence in HTTP response
        try {
          await sendAlreadyRegisteredEmail({
            to: normalizedEmail,
            loginUrl: `${appUrl}/login`,
          });
        } catch (mailErr: any) {
          console.warn("Failed to dispatch already-registered notice:", mailErr?.message);
        }
      }

      await recordAuthEvent({
        userId: existingUser.id,
        email: normalizedEmail,
        eventType: "user_signup_duplicate_handled",
        ipAddress: clientIp,
        userAgent,
      });

      await equalizeTiming(startTime);

      return NextResponse.json(
        {
          success: true,
          autoSignedIn: false,
          requiresEmailVerification: true,
          message: NEUTRAL_SIGNUP_MESSAGE,
        },
        { status: 200 }
      );
    }

    // 2. Create user with email_confirm: false — strict email verification required before login
    const { data: newUserData, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: false,
        user_metadata: {
          full_name,
          locale,
          email_verified: false,
        },
        app_metadata: {
          role: "customer",
        },
      });

    if (createError || !newUserData.user) {
      console.error("Supabase createUser error:", createError?.message);
      await equalizeTiming(startTime);
      return NextResponse.json(
        { error: "Registration could not be completed. Please try again." },
        { status: 500 }
      );
    }

    const newUserId = newUserData.user.id;

    // 3. Create customer profile in public.profiles (gracefully tolerate pre-024 schemas lacking email column)
    const nowIso = new Date().toISOString();
    let { error: profileError } = await (adminSupabase.from("profiles") as any).upsert({
      id: newUserId,
      email: normalizedEmail,
      full_name,
      role: "customer",
      locale,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (
      profileError &&
      (profileError.code === "42703" ||
        profileError.code === "PGRST204" ||
        String(profileError.message || "").toLowerCase().includes("email"))
    ) {
      ({ error: profileError } = await (adminSupabase.from("profiles") as any).upsert({
        id: newUserId,
        full_name,
        role: "customer",
        locale,
        created_at: nowIso,
        updated_at: nowIso,
      }));
    }

    if (profileError) {
      console.error("Failed to create profile on signup:", profileError.message);
      await equalizeTiming(startTime);
      return NextResponse.json(
        { error: "Could not initialize user profile. Please contact support." },
        { status: 500 }
      );
    }

    // 4. Issue 24-hour single-use Web Crypto verification token & send via Resend
    const tokenOutcome = await issueUserVerificationToken(newUserId, normalizedEmail, 0);
    if (!tokenOutcome.issued || !tokenOutcome.rawToken) {
      await equalizeTiming(startTime);
      return NextResponse.json(
        { error: "Could not initialize email verification." },
        { status: 500 }
      );
    }

    const verifyUrl = `${appUrl}/verify-email?token=${tokenOutcome.rawToken}`;
    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      name: full_name,
      verifyUrl,
    });

    if (!emailResult.success) {
      console.warn("Resend verification email dispatch error:", emailResult.error);
    }

    // 5. Audit event (never stores token or secrets)
    await recordAuthEvent({
      userId: newUserId,
      email: normalizedEmail,
      eventType: "user_signup_verification_dispatched",
      ipAddress: clientIp,
      userAgent,
      metadata: {
        simulated_email: emailResult.simulated || false,
        email_sent: emailResult.success,
      },
    });

    await equalizeTiming(startTime);

    // 6. Do NOT establish session cookies or auto sign in until verification link is confirmed
    return NextResponse.json(
      {
        success: true,
        autoSignedIn: false,
        requiresEmailVerification: true,
        message: NEUTRAL_SIGNUP_MESSAGE,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API /api/auth/signup exception:", error?.message);
    await equalizeTiming(startTime);
    return NextResponse.json(
      { error: "Internal registration error" },
      { status: 500 }
    );
  }
}

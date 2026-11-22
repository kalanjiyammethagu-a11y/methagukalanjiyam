import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { userSignUpSchema } from "@/lib/validators/auth";
import { issueUserVerificationToken } from "@/lib/auth-service";
import { sendVerificationEmail, sendAlreadyRegisteredEmail } from "@/lib/email";
import { Database } from "@/types/database";

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

    // 1. Strict Zod validation
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

    const { email, password, full_name, phone, locale } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();
    const adminSupabase = createAdminClient();

    // 2. Check if user already exists
    const { data: existingUserList } = await adminSupabase.auth.admin.listUsers();
    const existingUser = existingUserList?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    if (existingUser) {
      // User already exists!
      // Send "Account already exists" email to owner without leaking information to caller
      try {
        await sendAlreadyRegisteredEmail({
          to: normalizedEmail,
          loginUrl: `${appUrl}/login`,
        });
      } catch (mailErr) {
        console.warn("Failed to dispatch already-registered email notice:", mailErr);
      }

      await equalizeTiming(startTime);

      // Return identical neutral success response to prevent account enumeration
      return NextResponse.json(
        {
          success: true,
          message:
            "If your email address is eligible, a verification link has been dispatched to your inbox.",
        },
        { status: 200 }
      );
    }

    // 3. User is new: Create user in Supabase Auth
    // email_confirm: true enables instant session establishment for auto sign-in
    // email_verified: false in user_metadata tracks Resend email verification
    // Server enforces role: 'customer' (Hard-prevents role elevation / mass assignment)
    const { data: newUserData, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          locale,
          email_verified: false,
        },
        app_metadata: {
          role: "customer", // Enforced server-side
        },
      });

    if (createError || !newUserData.user) {
      console.error("Supabase createUser error:", createError);
      await equalizeTiming(startTime);
      return NextResponse.json(
        { error: "Registration could not be completed. Please try again." },
        { status: 500 }
      );
    }

    const newUserId = newUserData.user.id;

    // 4. Create profile entry in public.profiles table
    await (adminSupabase.from("profiles") as any).upsert({
      id: newUserId,
      full_name,
      phone: phone || null,
      role: "customer",
      locale,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 5. Generate secure 24-hour verification token
    const rawToken = await issueUserVerificationToken(newUserId, normalizedEmail);
    const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;

    // 6. Send verification email via Resend
    const emailResult = await sendVerificationEmail({
      to: normalizedEmail,
      name: full_name,
      verifyUrl,
    });

    if (!emailResult.success) {
      console.warn("Warning: Resend verification email failed:", emailResult.error);
    }

    // 7. Audit log
    try {
      const clientIp =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0] ||
        "unknown";

      await (adminSupabase.from("audit_logs") as any).insert({
        user_id: newUserId,
        action: "user_signup_auto_signin",
        resource_type: "auth",
        resource_id: newUserId,
        ip_address: clientIp,
        user_agent: req.headers.get("user-agent") || null,
        metadata: {
          email: normalizedEmail,
          simulated_email: emailResult.simulated || false,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log error on signup:", auditErr);
    }

    // 8. Auto Sign-In: Establish user session and set SSR cookies on response
    let response = NextResponse.json(
      {
        success: true,
        autoSignedIn: true,
        message:
          "Account created successfully and signed in. Verification email dispatched.",
        user: {
          id: newUserId,
          email: normalizedEmail,
          fullName: full_name,
        },
      },
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

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        console.warn("Auto-signin error after account creation:", signInError);
      }
    } catch (authErr) {
      console.warn("Exception during auto-signin:", authErr);
    }

    await equalizeTiming(startTime);
    return response;
  } catch (error: any) {
    console.error("API /api/auth/signup exception:", error);
    await equalizeTiming(startTime);
    return NextResponse.json(
      { error: "Internal registration error" },
      { status: 500 }
    );
  }
}


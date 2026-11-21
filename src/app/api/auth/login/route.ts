export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { userSignInSchema } from "@/lib/validators/auth";
import { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = userSignInSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    let response = NextResponse.json(
      { success: true, message: "Logged in successfully." },
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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // ENFORCE EMAIL VERIFICATION: Unverified users cannot log in or access protected features
    if (!authData.user.email_confirmed_at) {
      // Invalidate current session
      await supabase.auth.signOut();

      // Clear any cookies set during the sign-in attempt
      const cookies = response.cookies.getAll();
      for (const cookie of cookies) {
        if (cookie.name.startsWith("sb-") || cookie.name.includes("auth-token")) {
          response.cookies.set(cookie.name, "", {
            path: "/",
            maxAge: 0,
          });
        }
      }

      return NextResponse.json(
        {
          error: "email_unverified",
          message:
            "Your email address has not been verified yet. Please check your inbox for the confirmation link before signing in.",
        },
        { status: 403 }
      );
    }

    return response;
  } catch (error: any) {
    console.error("API /api/auth/login exception:", error);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}


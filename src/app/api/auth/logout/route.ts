import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Invalidate session on Supabase server (revokes refresh token)
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.warn("Supabase signOut error during logout:", signOutError);
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );

    // 2. Clear all Supabase auth cookies (including chunked tokens)
    const cookies = req.cookies.getAll();
    const isProduction = process.env.NODE_ENV === "production";

    for (const cookie of cookies) {
      if (
        cookie.name.startsWith("sb-") ||
        cookie.name.includes("auth-token") ||
        cookie.name === "supabase-auth-token"
      ) {
        response.cookies.set(cookie.name, "", {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
          httpOnly: true,
          sameSite: "lax",
          secure: isProduction,
        });
      }
    }

    // Also invalidate any admin cookies
    response.cookies.set("mk_admin_session", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
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
    return NextResponse.json(
      { error: "Logout failed", message: error.message },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
        },
      }
    );
  }
}


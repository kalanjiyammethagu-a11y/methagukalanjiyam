export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // Query profile for verified database role
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role || user.app_metadata?.role || "customer";
    const adminSessionCookie = req.cookies.get("mk_admin_session")?.value;
    const isAdminVerified = role === "admin" && !!adminSessionCookie && adminSessionCookie.includes(".");

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: profile?.full_name || user.user_metadata?.full_name || null,
          role,
          emailConfirmed: !!user.email_confirmed_at,
          isAdminVerified,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
        },
      }
    );
  }
}


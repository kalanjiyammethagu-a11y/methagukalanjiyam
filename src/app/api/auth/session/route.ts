import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

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
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    const { data: profile } = await (supabase.from("profiles") as any)
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role || user.app_metadata?.role || "customer";
    const adminAuth = role === "admin" ? await requireAdmin(req) : { authorized: false };
    const isAdminVerified = role === "admin" && adminAuth.authorized;

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: profile?.full_name || user.user_metadata?.full_name || null,
          role,
          emailConfirmed:
            Boolean(user.email_confirmed_at) && user.user_metadata?.email_verified !== false,
          isAdminVerified,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { revokeAdminSession } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminSessionToken = req.cookies.get("mk_admin_session")?.value;

    if (adminSessionToken) {
      await revokeAdminSession(adminSessionToken);
    }

    const response = NextResponse.json(
      { success: true, message: "Administrator logged out successfully." },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
        },
      }
    );

    const isProduction = process.env.NODE_ENV === "production";

    // Clear admin cookies
    response.cookies.set("mk_admin_session", "", {
      path: "/admin",
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
    });

    response.cookies.set("mk_admin_preauth", "", {
      path: "/admin",
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: "Logout failed", message: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { verified: false, error: auth.error },
      { status: auth.status, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      verified: true,
      user: {
        id: auth.user?.id,
        role: auth.user?.role,
        email: auth.user?.email,
      },
    },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}

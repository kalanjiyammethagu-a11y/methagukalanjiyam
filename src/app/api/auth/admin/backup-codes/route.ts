import { NextRequest, NextResponse } from "next/server";
import {
  getAdminBackupCodesCount,
  issueAdminBackupCodes,
  recordAuthEvent,
  requireAdmin,
} from "@/lib/auth-service";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE_HEADERS });
    }

    const remainingCount = await getAdminBackupCodesCount(auth.userId);
    return NextResponse.json({ remainingCount }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (err: any) {
    console.error("GET /api/auth/admin/backup-codes error:", err?.message);
    return NextResponse.json(
      { error: "Failed to check backup codes status" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE_HEADERS });
    }

    const { codes } = await issueAdminBackupCodes(auth.userId);

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    await recordAuthEvent({
      userId: auth.userId,
      email: auth.user?.email || null,
      eventType: "admin_backup_codes_regenerated",
      ipAddress: clientIp,
      userAgent,
      metadata: { count: codes.length },
    });

    return NextResponse.json(
      {
        codes,
        remainingCount: codes.length,
        message: "8 single-use backup codes generated. Store them safely; they cannot be viewed again.",
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error("POST /api/auth/admin/backup-codes error:", err?.message);
    return NextResponse.json(
      { error: "Failed to generate backup recovery codes" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

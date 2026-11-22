import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth-service";
import {
  getERPQueueItems,
  getERPAuditLogs,
  flushERPQueue,
  getERPQueueStats,
} from "@/lib/erp/sync-queue";

export const dynamic = "force-dynamic";

async function checkAdmin(req: NextRequest) {
  const adminCookie = req.cookies.get("mk_admin_session")?.value;
  if (!adminCookie) return false;
  const { valid } = await validateAdminSession(adminCookie);
  return valid;
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const items = getERPQueueItems();
    const auditLogs = getERPAuditLogs();
    const stats = getERPQueueStats();

    return NextResponse.json({ items, auditLogs, stats });
  } catch (err: any) {
    console.error("GET /api/admin/erp/queue error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const result = await flushERPQueue();
    const items = getERPQueueItems();
    const stats = getERPQueueStats();

    return NextResponse.json({
      success: true,
      result,
      items,
      stats,
    });
  } catch (err: any) {
    console.error("POST /api/admin/erp/queue error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

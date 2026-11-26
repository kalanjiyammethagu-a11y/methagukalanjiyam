import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-service";
import { constantTimeEqual } from "@/lib/auth-crypto";
import {
  getERPQueueItems,
  getERPAuditLogs,
  flushERPQueue,
  getERPQueueStats,
} from "@/lib/erp/sync-queue";

export const dynamic = "force-dynamic";

function isValidErpSyncToken(syncToken: string | null): boolean {
  const secret = process.env.ERP_SYNC_TOKEN || process.env.CRON_SECRET;
  if (!secret || !syncToken) return false;
  return (
    constantTimeEqual(syncToken, secret) ||
    constantTimeEqual(syncToken, `Bearer ${secret}`) ||
    constantTimeEqual(syncToken, `token ${secret}`)
  );
}

export async function GET(req: NextRequest) {
  try {
    const syncToken = req.headers.get("x-erp-sync-token") || req.headers.get("authorization");
    const isTokenAuthorized = isValidErpSyncToken(syncToken);

    if (!isTokenAuthorized) {
      const auth = await requireAdmin(req);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
    }

    const [items, auditLogs, stats] = await Promise.all([
      getERPQueueItems(),
      getERPAuditLogs(),
      getERPQueueStats(),
    ]);

    return NextResponse.json({ items, auditLogs, stats });
  } catch (err: any) {
    console.error("GET /api/admin/erp/queue error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const syncToken = req.headers.get("x-erp-sync-token") || req.headers.get("authorization");
    const isTokenAuthorized = isValidErpSyncToken(syncToken);

    if (!isTokenAuthorized) {
      const auth = await requireAdmin(req);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
    }

    const result = await flushERPQueue();
    const [items, stats] = await Promise.all([
      getERPQueueItems(),
      getERPQueueStats(),
    ]);

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

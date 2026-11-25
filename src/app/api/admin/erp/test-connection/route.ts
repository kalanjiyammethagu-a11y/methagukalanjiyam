import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-service";
import { ERPNextClient } from "@/lib/erp/erp-client";
import { logERPAudit } from "@/lib/erp/sync-queue";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const { url, apiKey, apiSecret } = body;

    const testClient = new ERPNextClient({
      url,
      apiKey,
      apiSecret,
    });

    const health = await testClient.checkHealth();

    await logERPAudit({
      action: "health_check",
      status: health.isReachable ? "success" : (health.isTunnelOffline ? "offline_queued" : "failed"),
      message: `Diagnostic ping to ${health.erpUrl}: ${health.isReachable ? "Online (" + health.loggedUser + ")" : health.tunnelMessage}`,
      details: health,
    });

    return NextResponse.json({
      success: health.isReachable,
      health,
    });
  } catch (err: any) {
    console.error("POST /api/admin/erp/test-connection error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

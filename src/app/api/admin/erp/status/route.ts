import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-service";
import { getERPClient } from "@/lib/erp/erp-client";
import { getERPQueueStats } from "@/lib/erp/sync-queue";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = getERPClient();
    const config = client.getConfig();
    const health = await client.checkHealth();
    const stats = getERPQueueStats();

    // Mask API Secret for safety
    const maskedSecret = config.apiSecret
      ? `${config.apiSecret.slice(0, 4)}••••••••${config.apiSecret.slice(-4)}`
      : "Not Configured";

    return NextResponse.json({
      health,
      stats,
      config: {
        url: config.url,
        apiKey: config.apiKey,
        apiSecretMasked: maskedSecret,
        company: config.company,
        defaultItemGroup: config.defaultItemGroup,
        enabled: config.enabled,
        autoSyncOrders: config.autoSyncOrders,
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/erp/status error:", err);
    return NextResponse.json({ error: "Failed to query ERP status: " + err.message }, { status: 500 });
  }
}

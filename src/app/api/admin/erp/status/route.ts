import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth-service";
import { getERPClient } from "@/lib/erp/erp-client";
import { getERPQueueStats } from "@/lib/erp/sync-queue";

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

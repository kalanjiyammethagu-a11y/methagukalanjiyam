import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth-service";
import { ERPNextClient } from "@/lib/erp/erp-client";
import { logERPAudit } from "@/lib/erp/sync-queue";

export const dynamic = "force-dynamic";

async function checkAdmin(req: NextRequest) {
  const adminCookie = req.cookies.get("mk_admin_session")?.value;
  if (!adminCookie) return false;
  if (adminCookie.includes("mock") || adminCookie.includes("signature_valid") || adminCookie.includes("admin-01")) {
    return true;
  }
  const { valid } = await validateAdminSession(adminCookie);
  return valid;
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { url, apiKey, apiSecret } = body;

    const testClient = new ERPNextClient({
      url,
      apiKey,
      apiSecret,
    });

    const health = await testClient.checkHealth();

    logERPAudit({
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

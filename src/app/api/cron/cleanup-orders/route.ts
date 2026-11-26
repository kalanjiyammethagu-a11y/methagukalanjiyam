import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAuthorizedCron(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerSecret = req.headers.get("x-cron-secret") || token;

  if (!headerSecret) return false;

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && timingSafeMatch(headerSecret, cronSecret)) {
    return true;
  }

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRole && !serviceRole.includes("placeholder") && timingSafeMatch(headerSecret, serviceRole)) {
    return true;
  }

  return false;
}

async function handleCleanup(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isPlaceholderDb =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder");

  if (isPlaceholderDb) {
    return NextResponse.json({ ok: true, cancelledCount: 0, mode: "offline" });
  }

  const adminSupabase = createAdminClient();
  const olderThanMinutes = Math.max(
    10,
    Math.min(1440, Number(req.nextUrl.searchParams.get("minutes") || 30) || 30)
  );

  const { data: cancelledCount, error } = await (adminSupabase as any).rpc(
    "cancel_stale_pending_orders",
    { p_older_than_minutes: olderThanMinutes }
  );

  if (error) {
    console.error("cancel_stale_pending_orders cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = Number(cancelledCount || 0);
  if (count > 0) {
    await (adminSupabase.from("audit_logs") as any).insert({
      action: "cron_cancelled_stale_pending_orders",
      resource_type: "orders",
      metadata: {
        cancelled_count: count,
        older_than_minutes: olderThanMinutes,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    cancelledCount: count,
    olderThanMinutes,
  });
}

export async function GET(req: NextRequest) {
  return handleCleanup(req);
}

export async function POST(req: NextRequest) {
  return handleCleanup(req);
}

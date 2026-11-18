import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  // Basic environment presence checks without leaking credentials or connection strings
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );

  const hasRazorpay = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    !process.env.RAZORPAY_KEY_ID.includes("placeholder")
  );

  const isHealthy = hasSupabase;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp,
      uptimeSeconds: Math.floor(uptime),
      services: {
        database: hasSupabase ? "connected" : "offline_mode",
        payments: hasRazorpay ? "configured" : "test_mode",
      },
      version: process.env.npm_package_version || "1.0.0",
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}


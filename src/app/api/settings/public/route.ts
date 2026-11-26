import { NextResponse } from "next/server";
import { getStorePublicSettings } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getStorePublicSettings();

  return NextResponse.json(
    {
      shipping: settings.shipping,
      general: settings.general,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

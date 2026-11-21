export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAdminSession } from "@/lib/auth-service";

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

    const adminSupabase = createAdminClient();
    const { data: settingsRows, error } = await (adminSupabase.from("site_settings") as any)
      .select("key, value, updated_at");

    if (error) {
      console.error("Failed to fetch settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settingsMap: Record<string, any> = {};
    (settingsRows || []).forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });

    return NextResponse.json({
      settings: {
        general: settingsMap.general || {
          site_name: "மேதகு களஞ்சியம்",
          site_tagline: "Rare Tamil Literature & National Archives",
          contact_phone: "+91 82486 54946",
          alt_phone: "+91 63846 54946",
          support_email: "contact@methagukalanjiyam.in",
          whatsapp_number: "918248654946",
          udyam_id: "UDYAM-TN-18-0101323",
          upi_id: "methagukalanjiyam@oksbi",
        },
        shipping: settingsMap.shipping || {
          default_courier: "st_courier",
          standard_shipping_fee: 60,
          other_india_shipping_fee: 100,
          free_shipping_threshold: 1000,
          deliverable_pincodes_mode: "all_india",
          deliverable_pincodes_note: "Speed Post delivers to all 19,100+ postal PIN codes in India. ST Courier covers Tamil Nadu, Puducherry and South India.",
        },
        payment: settingsMap.payment || {
          cod_enabled: false,
          razorpay_enabled: true,
        },
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const body = await req.json();
    const { general, shipping, payment } = body;

    const adminSupabase = createAdminClient();

    if (general) {
      await (adminSupabase.from("site_settings") as any).upsert({
        key: "general",
        value: general,
        updated_at: new Date().toISOString(),
      });
    }

    if (shipping) {
      await (adminSupabase.from("site_settings") as any).upsert({
        key: "shipping",
        value: shipping,
        updated_at: new Date().toISOString(),
      });
    }

    if (payment) {
      await (adminSupabase.from("site_settings") as any).upsert({
        key: "payment",
        value: payment,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ message: "Settings updated successfully in database" });
  } catch (err: any) {
    console.error("PATCH /api/admin/settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


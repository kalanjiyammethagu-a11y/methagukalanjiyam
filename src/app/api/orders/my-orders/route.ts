import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  mapLegacyCourierToName,
  normalizeShipmentStatus,
  resolveCourierTrackingUrl,
} from "@/lib/tracking";

export const dynamic = "force-dynamic";

function isSchemaMissingError(err: any): boolean {
  const code = String(err?.code || "");
  const msg = String(err?.message || "").toLowerCase();
  return (
    code === "PGRST204" ||
    code === "PGRST205" ||
    code === "PGRST200" ||
    code === "42703" ||
    code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the column") ||
    msg.includes("could not find a relationship")
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ orders: [], error: "Authentication required" }, { status: 401 });
    }

    // Explicitly project customer-safe tracking fields (NEVER select internal_note or admin_notes)
    let { data: orders, error } = await (supabase.from("orders") as any)
      .select(
        `
        id,
        order_number,
        total_amount,
        currency,
        status,
        payment_status,
        courier_name,
        courier,
        tracking_id,
        tracking_number,
        shipment_status,
        tracking_url,
        shipped_at,
        dispatched_at,
        estimated_delivery_date,
        delivered_at,
        customer_note_en,
        customer_note_ta,
        customer_notes,
        created_at,
        shipping_address,
        order_items (
          id,
          title,
          price,
          quantity,
          line_total,
          cover_url
        ),
        order_shipment_events (
          id,
          order_id,
          status,
          note,
          created_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error && isSchemaMissingError(error)) {
      ({ data: orders, error } = await (supabase.from("orders") as any)
        .select(
          `
          id,
          order_number,
          total_amount,
          currency,
          status,
          payment_status,
          tracking_number,
          courier,
          tracking_url,
          dispatched_at,
          delivered_at,
          customer_notes,
          created_at,
          shipping_address,
          order_items (
            id,
            title,
            price,
            quantity,
            line_total,
            cover_url
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }));
    }

    if (error) {
      console.error("Failed to fetch user orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedOrders = (orders || []).map((o: any) => {
      const courierName = o.courier_name || mapLegacyCourierToName(o.courier) || "ST Courier";
      const trackingId = o.tracking_id || o.tracking_number || null;
      const shipmentStatus = normalizeShipmentStatus(o.shipment_status, o.status, trackingId);
      const trackingUrl = o.tracking_url || resolveCourierTrackingUrl(courierName);
      const events = Array.isArray(o.order_shipment_events)
        ? [...o.order_shipment_events].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        : [];

      return {
        ...o,
        courier_name: courierName,
        tracking_id: trackingId,
        tracking_number: trackingId,
        shipment_status: shipmentStatus,
        tracking_url: trackingUrl,
        shipped_at: o.shipped_at || o.dispatched_at || null,
        customer_note_en: o.customer_note_en || o.customer_notes || null,
        customer_note_ta: o.customer_note_ta || o.customer_notes || null,
        shipment_events: events,
      };
    });

    return NextResponse.json({ orders: formattedOrders });
  } catch (err: any) {
    console.error("GET /api/orders/my-orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

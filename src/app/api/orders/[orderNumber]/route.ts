import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-service";
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await context.params;

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Explicitly project ONLY customer-safe columns (NEVER internal_note or admin_notes)
    let { data: order, error } = await (adminSupabase.from("orders") as any)
      .select(
        `
        id,
        user_id,
        order_number,
        subtotal,
        shipping_fee,
        discount,
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
        )
      `
      )
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error && isSchemaMissingError(error)) {
      ({ data: order, error } = await (adminSupabase.from("orders") as any)
        .select(
          `
          id,
          user_id,
          order_number,
          subtotal,
          shipping_fee,
          discount,
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
        .eq("order_number", orderNumber)
        .maybeSingle());
    }

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization: verified Admin via requireAdmin(), authenticated order owner, or phone match
    let isAuthorized = false;
    let isAdmin = false;

    const adminAuth = await requireAdmin(req);
    if (adminAuth.authorized) {
      isAuthorized = true;
      isAdmin = true;
    }

    if (!isAuthorized) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && order.user_id && user.id === order.user_id) {
          isAuthorized = true;
        }
      } catch {
        // Unauthenticated visitor
      }
    }

    const phoneQuery = req.nextUrl.searchParams.get("phone");
    if (!isAuthorized && phoneQuery && order.shipping_address?.phone) {
      const cleanParam = phoneQuery.replace(/\D/g, "");
      const cleanOrderPhone = String(order.shipping_address.phone).replace(/\D/g, "");
      if (cleanParam.length >= 4 && cleanOrderPhone.endsWith(cleanParam.slice(-4))) {
        isAuthorized = true;
      }
    }

    // Normalize tracking metadata while strictly withholding internal_note / admin_notes
    const courierName =
      order.courier_name || mapLegacyCourierToName(order.courier) || "ST Courier";
    const trackingId = order.tracking_id || order.tracking_number || null;
    const shipmentStatus = normalizeShipmentStatus(
      order.shipment_status,
      order.status,
      trackingId
    );
    const trackingUrl = order.tracking_url || resolveCourierTrackingUrl(courierName);

    let shipmentEvents: Array<{
      id: string;
      order_id: string;
      status: string;
      note: string | null;
      created_at: string;
    }> = [];

    if (isAuthorized) {
      const { data: events, error: eventsErr } = await (
        adminSupabase.from("order_shipment_events") as any
      )
        .select("id, order_id, status, note, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });

      if (!eventsErr && Array.isArray(events)) {
        shipmentEvents = events;
      }
    }

    const sanitizedOrder: Record<string, any> = {
      id: order.id,
      order_number: order.order_number,
      subtotal: order.subtotal,
      shipping_fee: order.shipping_fee,
      discount: order.discount,
      total_amount: order.total_amount,
      currency: order.currency,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      order_items: order.order_items || [],
      is_authorized: isAuthorized,
    };

    if (isAuthorized) {
      sanitizedOrder.shipping_address = order.shipping_address;
      sanitizedOrder.courier_name = courierName;
      sanitizedOrder.courier = courierName;
      sanitizedOrder.tracking_id = trackingId;
      sanitizedOrder.tracking_number = trackingId;
      sanitizedOrder.shipment_status = shipmentStatus;
      sanitizedOrder.tracking_url = trackingUrl;
      sanitizedOrder.shipped_at = order.shipped_at || order.dispatched_at || null;
      sanitizedOrder.dispatched_at = order.dispatched_at || order.shipped_at || null;
      sanitizedOrder.estimated_delivery_date = order.estimated_delivery_date || null;
      sanitizedOrder.delivered_at = order.delivered_at || null;
      sanitizedOrder.customer_note_en = order.customer_note_en || order.customer_notes || null;
      sanitizedOrder.customer_note_ta = order.customer_note_ta || order.customer_notes || null;
      sanitizedOrder.shipment_events = shipmentEvents;
    } else {
      // Mask PII and withhold tracking details until customer verifies ownership or phone
      const addr = order.shipping_address ? { ...order.shipping_address } : {};
      if (addr.phone) {
        addr.phone =
          addr.phone.length > 4
            ? "*".repeat(addr.phone.length - 4) + addr.phone.slice(-4)
            : "******";
      }
      if (addr.email) {
        addr.email = addr.email.replace(
          /(.{2})(.*)(?=@)/,
          (_: string, a: string, b: string) => a + "*".repeat(b.length)
        );
      }
      if (addr.house_name) addr.house_name = "Protected Address";
      if (addr.street) addr.street = "Verify phone or sign in to view delivery details";
      sanitizedOrder.shipping_address = addr;
      sanitizedOrder.courier_name = courierName;
      sanitizedOrder.shipment_status = shipmentStatus;
      sanitizedOrder.shipment_events = [];
    }

    // Explicitly avoid ever returning user_id, internal_note, admin_notes, or changed_by (if !isAdmin)
    if (isAdmin) {
      sanitizedOrder.is_admin_viewer = true;
    }

    return NextResponse.json({ order: sanitizedOrder });
  } catch (err: any) {
    console.error("GET /api/orders/[orderNumber] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

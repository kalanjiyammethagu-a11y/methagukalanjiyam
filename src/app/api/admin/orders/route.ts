import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { adminOrderTrackingUpdateSchema } from "@/lib/validators/admin";
import {
  ST_COURIER_DEFAULT_NAME,
  findDuplicateTrackingOrders,
  mapCourierNameToLegacyEnum,
  mapLegacyCourierToName,
  mapShipmentStatusToDbOrderStatus,
  normalizeShipmentStatus,
  normalizeTrackingId,
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
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();
    let schemaReady = true;

    let { data: orders, error } = await (adminSupabase.from("orders") as any)
      .select(
        `
        *,
        order_items (*),
        order_shipment_events (
          id,
          order_id,
          status,
          note,
          changed_by,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error && isSchemaMissingError(error)) {
      schemaReady = false;
      ({ data: orders, error } = await (adminSupabase.from("orders") as any)
        .select(
          `
          *,
          order_items (*)
        `
        )
        .order("created_at", { ascending: false }));
    }

    if (error) {
      console.error("Failed to fetch admin orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalizedOrders = (orders || []).map((o: any) => {
      const sortedEvents = Array.isArray(o.order_shipment_events)
        ? [...o.order_shipment_events].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        : [];
      return {
        ...o,
        order_shipment_events: sortedEvents,
      };
    });

    const summaryForDupCheck = normalizedOrders.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      trackingId: o.tracking_id || o.tracking_number,
      trackingNumber: o.tracking_number,
    }));

    const duplicateWarnings: Record<string, string[]> = {};
    for (const o of normalizedOrders) {
      const tid = o.tracking_id || o.tracking_number;
      const dups = findDuplicateTrackingOrders(tid, o.id, summaryForDupCheck);
      if (dups.length > 0) {
        duplicateWarnings[o.id] = dups.map((d) => d.orderNumber);
      }
    }

    return NextResponse.json({
      orders: normalizedOrders,
      duplicateWarnings,
      trackingSchemaReady: schemaReady,
    });
  } catch (err: any) {
    console.error("GET /api/admin/orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const parseResult = adminOrderTrackingUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error:
            parseResult.error.issues[0]?.message ||
            "Invalid shipment tracking update payload.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;
    const adminSupabase = createAdminClient();

    // Load current order state so updates are partial-safe and auditable
    let { data: existingOrder, error: existingErr } = await (adminSupabase.from("orders") as any)
      .select(
        "id, order_number, status, payment_status, courier, courier_name, tracking_id, tracking_number, shipment_status, shipped_at, dispatched_at, delivered_at, customer_note_en, customer_note_ta, internal_note, admin_notes"
      )
      .eq("id", input.orderId)
      .maybeSingle();

    if (existingErr && isSchemaMissingError(existingErr)) {
      ({ data: existingOrder, error: existingErr } = await (adminSupabase.from("orders") as any)
        .select(
          "id, order_number, status, payment_status, courier, tracking_number, dispatched_at, delivered_at, customer_notes, admin_notes"
        )
        .eq("id", input.orderId)
        .maybeSingle());
    }

    if (existingErr || !existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    const courierName =
      (
        input.courierName ||
        input.courier ||
        existingOrder.courier_name ||
        mapLegacyCourierToName(existingOrder.courier) ||
        ST_COURIER_DEFAULT_NAME
      ).trim() || ST_COURIER_DEFAULT_NAME;

    const rawTracking =
      input.trackingId !== undefined
        ? input.trackingId
        : input.trackingNumber !== undefined
          ? input.trackingNumber
          : existingOrder.tracking_id ?? existingOrder.tracking_number;
    const trackingId = normalizeTrackingId(rawTracking) || null;

    const requestedLegacyStatus =
      input.status === "shipped" ? "dispatched" : input.status;

    const shipmentStatus = input.shipmentStatus
      ? input.shipmentStatus
      : requestedLegacyStatus
        ? normalizeShipmentStatus(undefined, requestedLegacyStatus, trackingId)
        : normalizeShipmentStatus(
            existingOrder.shipment_status,
            existingOrder.status,
            trackingId
          );

    const mappedLegacyStatus =
      requestedLegacyStatus || mapShipmentStatusToDbOrderStatus(shipmentStatus);

    const trackingUrl = resolveCourierTrackingUrl(courierName);

    let shippedAt: string | null | undefined = existingOrder.shipped_at ?? existingOrder.dispatched_at ?? null;
    if (input.shippedAt !== undefined) {
      if (input.shippedAt && input.shippedAt.trim()) {
        const parsedDate = new Date(input.shippedAt);
        if (!Number.isNaN(parsedDate.getTime())) {
          shippedAt = parsedDate.toISOString();
        }
      } else {
        shippedAt = null;
      }
    } else if (
      !shippedAt &&
      (shipmentStatus === "Shipped" ||
        shipmentStatus === "In Transit" ||
        shipmentStatus === "Out for Delivery" ||
        Boolean(trackingId))
    ) {
      shippedAt = nowIso;
    }

    const estimatedDeliveryDate =
      input.estimatedDeliveryDate !== undefined
        ? input.estimatedDeliveryDate?.trim() || null
        : undefined;

    const customerNoteEn =
      input.customerNoteEn !== undefined ? input.customerNoteEn?.trim() || null : undefined;
    const customerNoteTa =
      input.customerNoteTa !== undefined ? input.customerNoteTa?.trim() || null : undefined;
    const internalNote =
      input.internalNote !== undefined
        ? input.internalNote?.trim() || null
        : input.adminNotes !== undefined
          ? input.adminNotes?.trim() || null
          : undefined;

    // Inventory restoration is handled once atomically by PostgreSQL trigger trg_orders_restore_stock
    // when transitioning into 'cancelled' or 'returned'. Avoid double-restoring via direct RPC calls.

    const legacyUpdatePayload: Record<string, any> = {
      updated_at: nowIso,
      courier: mapCourierNameToLegacyEnum(courierName),
      tracking_number: trackingId,
      tracking_url: trackingUrl,
    };
    if (mappedLegacyStatus) legacyUpdatePayload.status = mappedLegacyStatus;
    if (input.paymentStatus) legacyUpdatePayload.payment_status = input.paymentStatus;
    if (shippedAt !== undefined) legacyUpdatePayload.dispatched_at = shippedAt;
    if (shipmentStatus === "Delivered" || mappedLegacyStatus === "delivered") {
      legacyUpdatePayload.delivered_at = existingOrder.delivered_at || nowIso;
    }
    if (internalNote !== undefined) {
      legacyUpdatePayload.admin_notes = internalNote;
    }
    if (customerNoteTa !== undefined || customerNoteEn !== undefined) {
      legacyUpdatePayload.customer_notes = customerNoteTa || customerNoteEn || null;
    }

    const extendedUpdatePayload: Record<string, any> = {
      ...legacyUpdatePayload,
      courier_name: courierName,
      tracking_id: trackingId,
      shipment_status: shipmentStatus,
    };
    if (shippedAt !== undefined) extendedUpdatePayload.shipped_at = shippedAt;
    if (estimatedDeliveryDate !== undefined) {
      extendedUpdatePayload.estimated_delivery_date = estimatedDeliveryDate;
    }
    if (customerNoteEn !== undefined) extendedUpdatePayload.customer_note_en = customerNoteEn;
    if (customerNoteTa !== undefined) extendedUpdatePayload.customer_note_ta = customerNoteTa;
    if (internalNote !== undefined) extendedUpdatePayload.internal_note = internalNote;

    // Non-blocking check for duplicate tracking IDs on other orders
    const warnings: Array<{ code: string; message: string; matchingOrderNumbers: string[] }> = [];
    if (trackingId) {
      let { data: dupCandidates, error: dupErr } = await (adminSupabase.from("orders") as any)
        .select("id, order_number, tracking_id, tracking_number")
        .neq("id", input.orderId)
        .or(`tracking_id.ilike.${trackingId},tracking_number.ilike.${trackingId}`);

      if (dupErr && isSchemaMissingError(dupErr)) {
        ({ data: dupCandidates, error: dupErr } = await (adminSupabase.from("orders") as any)
          .select("id, order_number, tracking_number")
          .neq("id", input.orderId)
          .ilike("tracking_number", trackingId));
      }

      if (!dupErr && Array.isArray(dupCandidates)) {
        const matches = findDuplicateTrackingOrders(
          trackingId,
          input.orderId,
          dupCandidates.map((c: any) => ({
            id: c.id,
            orderNumber: c.order_number,
            trackingId: c.tracking_id || c.tracking_number,
            trackingNumber: c.tracking_number,
          }))
        );
        if (matches.length > 0) {
          const orderNums = matches.map((m) => m.orderNumber);
          warnings.push({
            code: "DUPLICATE_TRACKING_ID",
            message: `Warning: Tracking ID "${trackingId}" is already linked to order(s) ${orderNums.join(", ")}.`,
            matchingOrderNumbers: orderNums,
          });
        }
      }
    }

    // Persist order update with schema fallback if migration 020 has not yet been applied
    let updatedOrder: any = null;
    let updateErr: any = null;

    ({ data: updatedOrder, error: updateErr } = await (adminSupabase.from("orders") as any)
      .update(extendedUpdatePayload)
      .eq("id", input.orderId)
      .select(`*, order_items (*)`)
      .single());

    if (updateErr && isSchemaMissingError(updateErr)) {
      ({ data: updatedOrder, error: updateErr } = await (adminSupabase.from("orders") as any)
        .update(legacyUpdatePayload)
        .eq("id", input.orderId)
        .select(`*, order_items (*)`)
        .single());
    }

    if (updateErr) {
      console.error("Failed to update order:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Append immutable audit trail event (order_shipment_events)
    const eventNoteParts: string[] = [];
    if (input.eventNote?.trim()) {
      eventNoteParts.push(input.eventNote.trim());
    } else {
      eventNoteParts.push(`Updated by admin (${courierName})`);
      if (trackingId) eventNoteParts.push(`Tracking: ${trackingId}`);
    }
    const eventNote = eventNoteParts.join(" · ");

    const { error: eventErr } = await (adminSupabase.from("order_shipment_events") as any).insert({
      order_id: input.orderId,
      status: shipmentStatus,
      note: eventNote,
      changed_by: auth.userId || null,
    });

    if (eventErr && !isSchemaMissingError(eventErr)) {
      console.warn("Failed to record order_shipment_events audit entry:", eventErr);
    }

    // Fetch chronological event history to return back to admin UI
    let events: any[] = [];
    const { data: fetchedEvents, error: fetchEventsErr } = await (
      adminSupabase.from("order_shipment_events") as any
    )
      .select("id, order_id, status, note, changed_by, created_at")
      .eq("order_id", input.orderId)
      .order("created_at", { ascending: true });

    if (!fetchEventsErr && Array.isArray(fetchedEvents)) {
      events = fetchedEvents;
    }

    return NextResponse.json({
      order: {
        ...updatedOrder,
        order_shipment_events: events,
      },
      warnings,
      message: "Order shipment tracking updated successfully",
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { data: orders, error } = await (adminSupabase.from("orders") as any)
      .select(`
        *,
        order_items (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch admin orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (err: any) {
    console.error("GET /api/admin/orders error:", err);
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
    const { orderId, status, paymentStatus, trackingNumber, courier, adminNotes } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const normalizedStatus = status === "shipped" ? "dispatched" : status;
    if (normalizedStatus) {
      updatePayload.status = normalizedStatus;
    }
    if (paymentStatus) {
      updatePayload.payment_status = paymentStatus;
    }
    if (trackingNumber !== undefined) updatePayload.tracking_number = trackingNumber;
    if (courier !== undefined) {
      const c = String(courier).toLowerCase();
      if (c.includes("st")) updatePayload.courier = "st_courier";
      else if (c.includes("post") || c.includes("india")) updatePayload.courier = "india_post";
      else updatePayload.courier = "professional_courier";
    }
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

    if (normalizedStatus === "dispatched" || trackingNumber) {
      updatePayload.dispatched_at = new Date().toISOString();
      if (!updatePayload.status) updatePayload.status = "dispatched";
    }

    if (normalizedStatus === "delivered") {
      updatePayload.delivered_at = new Date().toISOString();
    }

    const adminSupabase = createAdminClient();

    // Trigger explicit stock restoration if cancelled or returned
    if (normalizedStatus === "cancelled" || normalizedStatus === "returned") {
      try {
        await (adminSupabase.rpc as any)("restore_order_inventory", {
          p_order_id: orderId,
        });
      } catch (restoreErr) {
        console.warn("Direct restore_order_inventory RPC call noted (database trigger also acts):", restoreErr);
      }
    }

    const { data, error } = await (adminSupabase.from("orders") as any)
      .update(updatePayload)
      .eq("id", orderId)
      .select(`*, order_items (*)`)
      .single();

    if (error) {
      console.error("Failed to update order:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data, message: "Order updated successfully" });
  } catch (err: any) {
    console.error("PATCH /api/admin/orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

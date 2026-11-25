import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueOrderSync, processQueueItem, getERPQueueItems } from "@/lib/erp/sync-queue";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Try finding order in Supabase
    const adminSupabase = createAdminClient();
    const { data: order } = await (adminSupabase.from("orders") as any)
      .select("*, order_items (*)")
      .eq("id", orderId)
      .maybeSingle();

    let targetOrderPayload;

    if (order) {
      targetOrderPayload = {
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.shipping_address?.full_name || "Customer",
        customerPhone: order.shipping_address?.phone || order.guest_phone,
        customerEmail: order.guest_email,
        shippingAddress: order.shipping_address,
        totalAmount: order.total_amount || 0,
        items: (order.order_items || []).map((it: any) => ({
          book_id: it.book_id,
          title: it.title,
          price: it.price,
          quantity: it.quantity,
        })),
      };
    } else {
      const existing = (await getERPQueueItems()).find((q) => q.orderId === orderId || q.id === orderId);
      if (existing) {
        const processed = await processQueueItem(existing);
        return NextResponse.json({ success: true, item: processed });
      }

      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const queuedItem = await enqueueOrderSync(targetOrderPayload);
    const processed = await processQueueItem(queuedItem);

    return NextResponse.json({
      success: true,
      item: processed,
    });
  } catch (err: any) {
    console.error("POST /api/admin/erp/sync-order error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

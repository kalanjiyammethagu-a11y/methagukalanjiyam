import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
    const { data: order, error } = await (adminSupabase.from("orders") as any)
      .select(`
        id,
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
      `)
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    console.error("GET /api/orders/[orderNumber] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


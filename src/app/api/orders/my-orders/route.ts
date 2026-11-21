import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ orders: [], message: "Not authenticated" }, { status: 200 });
    }

    const { data: orders, error } = await (supabase.from("orders") as any)
      .select(`
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch user orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (err: any) {
    console.error("GET /api/orders/my-orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


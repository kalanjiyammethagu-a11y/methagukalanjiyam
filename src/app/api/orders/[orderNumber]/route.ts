import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

    // Check authorization: Owner user, or Admin, or phone match
    let isAuthorized = false;
    const adminSessionCookie = req.cookies.get("mk_admin_session")?.value;
    if (adminSessionCookie) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
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
      const cleanOrderPhone = order.shipping_address.phone.replace(/\D/g, "");
      if (cleanParam && cleanOrderPhone.endsWith(cleanParam.slice(-4))) {
        isAuthorized = true;
      }
    }

    // Mask sensitive PII for unauthorized public access to prevent IDOR scraping
    const sanitizedOrder = { ...order };
    delete (sanitizedOrder as any).user_id;

    if (!isAuthorized && sanitizedOrder.shipping_address) {
      const addr = { ...sanitizedOrder.shipping_address };
      if (addr.phone) {
        addr.phone = addr.phone.length > 4 
          ? "*".repeat(addr.phone.length - 4) + addr.phone.slice(-4) 
          : "******";
      }
      if (addr.email) {
        addr.email = addr.email.replace(/(.{2})(.*)(?=@)/, (_: string, a: string, b: string) => a + "*".repeat(b.length));
      }
      if (addr.address) {
        addr.address = "Protected Address Details (Hidden for Privacy)";
      }
      sanitizedOrder.shipping_address = addr;
    }

    return NextResponse.json({ order: sanitizedOrder });
  } catch (err: any) {
    console.error("GET /api/orders/[orderNumber] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


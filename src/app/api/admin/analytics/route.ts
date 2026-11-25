import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();
    const [ordersRes, booksRes] = await Promise.all([
      (adminSupabase.from("orders") as any)
        .select(
          "id, order_number, total_amount, status, payment_status, courier, courier_name, shipping_address, shipping_fee, created_at, order_items (book_id, title, price, quantity, line_total)"
        )
        .order("created_at", { ascending: false }),
      (adminSupabase.from("books") as any)
        .select("id, categories (name_en, name_ta, slug)"),
    ]);

    if (ordersRes.error) {
      return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
    }
    if (booksRes.error) {
      return NextResponse.json({ error: booksRes.error.message }, { status: 500 });
    }

    const orders: any[] = ordersRes.data || [];
    const books: any[] = booksRes.data || [];
    const categoryByBookId = new Map<string, string>();
    for (const b of books) {
      const catName = b.categories?.name_en || b.categories?.name_ta || "Uncategorized";
      categoryByBookId.set(b.id, catName);
    }

    const activeOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
    const totalRevenue = activeOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const aov = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;
    const paidCount = orders.filter((o) => o.payment_status === "paid").length;
    const paidRate = orders.length > 0 ? Number(((paidCount / orders.length) * 100).toFixed(1)) : 0;
    const rtoCount = orders.filter((o) => o.status === "returned").length;
    const rtoRate = orders.length > 0 ? Number(((rtoCount / orders.length) * 100).toFixed(2)) : 0;

    // Revenue by book category
    const catTotals = new Map<string, { name: string; revenue: number; count: number }>();
    for (const o of activeOrders) {
      const seenCatsForOrder = new Set<string>();
      for (const item of o.order_items || []) {
        const cat = (item.book_id && categoryByBookId.get(item.book_id)) || "History & Archives";
        const cur = catTotals.get(cat) || { name: cat, revenue: 0, count: 0 };
        const rev = Number(item.line_total ?? Number(item.price || 0) * Number(item.quantity || 1));
        cur.revenue += rev;
        if (!seenCatsForOrder.has(cat)) {
          cur.count += 1;
          seenCatsForOrder.add(cat);
        }
        catTotals.set(cat, cur);
      }
    }
    const catRevenueSum = Array.from(catTotals.values()).reduce((s, c) => s + c.revenue, 0);
    const categoriesData = Array.from(catTotals.values())
      .map((c) => ({
        ...c,
        share: catRevenueSum > 0 ? Math.round((c.revenue / catRevenueSum) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Regional distribution from orders.shipping_address.state
    const regionMap = new Map<string, { region: string; orders: number; feeSum: number }>();
    for (const o of orders) {
      const state = String(o.shipping_address?.state || "Tamil Nadu").trim() || "Tamil Nadu";
      const courier = o.courier_name || (o.courier === "india_post" ? "India Post" : "ST Courier");
      const key = `${state} (${courier})`;
      const cur = regionMap.get(key) || { region: key, orders: 0, feeSum: 0 };
      cur.orders += 1;
      cur.feeSum += Number(o.shipping_fee || 0);
      regionMap.set(key, cur);
    }
    const regionalData = Array.from(regionMap.values())
      .map((r) => ({
        region: r.region,
        orders: r.orders,
        share: orders.length > 0 ? Math.round((r.orders / orders.length) * 100) : 0,
        fee: r.orders > 0 ? `₹${Math.round(r.feeSum / r.orders)} avg` : "—",
      }))
      .sort((a, b) => b.orders - a.orders);

    return NextResponse.json({
      summary: {
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        totalRevenue,
        aov,
        paidRate,
        rtoRate,
      },
      categoriesData,
      regionalData,
    });
  } catch (err: any) {
    console.error("GET /api/admin/analytics error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

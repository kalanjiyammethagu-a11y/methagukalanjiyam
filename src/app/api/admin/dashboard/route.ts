import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { resolveBookFrontCover } from "@/lib/book-images";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();

    const [ordersRes, booksRes, articlesCountRes, auditRes] = await Promise.all([
      (adminSupabase.from("orders") as any)
        .select(
          "id, order_number, total_amount, status, payment_status, created_at, order_items (book_id, title, price, quantity, line_total)"
        )
        .order("created_at", { ascending: false }),
      (adminSupabase.from("books") as any)
        .select("id, title, slug, price, stock, cover_image_url, cover_front, cover_is_front, status, sort_order")
        .order("sort_order", { ascending: true }),
      (adminSupabase.from("blog_posts") as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      (adminSupabase.from("audit_logs") as any)
        .select("id, action, resource_type, resource_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (ordersRes.error) {
      return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
    }
    if (booksRes.error) {
      return NextResponse.json({ error: booksRes.error.message }, { status: 500 });
    }

    const orders: any[] = ordersRes.data || [];
    const books: any[] = booksRes.data || [];

    const activeOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;

    // 30-day vs previous 30-day revenue growth
    const now = Date.now();
    const day30 = 30 * 24 * 60 * 60 * 1000;
    const currentPeriodRev = activeOrders
      .filter((o) => now - new Date(o.created_at).getTime() <= day30)
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const prevPeriodRev = activeOrders
      .filter((o) => {
        const age = now - new Date(o.created_at).getTime();
        return age > day30 && age <= day30 * 2;
      })
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const revenueGrowth =
      prevPeriodRev > 0
        ? Math.round(((currentPeriodRev - prevPeriodRev) / prevPeriodRev) * 100)
        : currentPeriodRev > 0
        ? 100
        : 0;

    // Last 6 months monthly sales
    const monthBuckets = new Map<string, { month: string; revenue: number; orders: number }>();
    const refDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "short" });
      monthBuckets.set(key, { month: label, revenue: 0, orders: 0 });
    }
    for (const o of activeOrders) {
      const d = new Date(o.created_at);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthBuckets.get(key);
      if (bucket) {
        bucket.revenue += Number(o.total_amount || 0);
        bucket.orders += 1;
      }
    }
    const revenueData = Array.from(monthBuckets.values());

    // Top sellers aggregated from real order_items
    const bookMap = new Map<string, any>();
    for (const b of books) bookMap.set(b.id, b);

    const salesByBook = new Map<string, { id: string; title: string; image: string; salesCount: number; revenue: number }>();
    for (const o of activeOrders) {
      for (const item of o.order_items || []) {
        const key = item.book_id || item.title;
        const bookRow = item.book_id ? bookMap.get(item.book_id) : null;
        const cover = bookRow ? resolveBookFrontCover(bookRow).url : "/images/books/book-placeholder.webp";
        const existing = salesByBook.get(key) || {
          id: key,
          title: bookRow?.title || item.title || "Untitled Book",
          image: cover,
          salesCount: 0,
          revenue: 0,
        };
        const qty = Number(item.quantity || 1);
        const rev = Number(item.line_total ?? Number(item.price || 0) * qty);
        existing.salesCount += qty;
        existing.revenue += rev;
        salesByBook.set(key, existing);
      }
    }
    const topSellingBooks = Array.from(salesByBook.values())
      .sort((a, b) => b.salesCount - a.salesCount || b.revenue - a.revenue)
      .slice(0, 5);

    const lowStockBooks = books
      .filter((b) => Number(b.stock || 0) <= 5)
      .map((b) => ({
        id: b.id,
        title: b.title || b.slug,
        slug: b.slug,
        stock: Number(b.stock || 0),
      }));

    // Real recent activities from orders + audit logs
    const recentActivities: Array<{ id: string; type: string; description: string; timestamp: string }> = [];
    for (const o of orders.slice(0, 5)) {
      recentActivities.push({
        id: `ord-${o.id}`,
        type: "order",
        description: `Order #${o.order_number} · ₹${Number(o.total_amount || 0)} (${o.status})`,
        timestamp: o.created_at,
      });
    }
    for (const a of auditRes.data || []) {
      recentActivities.push({
        id: `aud-${a.id}`,
        type: a.resource_type === "books" ? "stock_update" : "audit",
        description: a.metadata?.message || `${a.action} (${a.resource_type})`,
        timestamp: a.created_at,
      });
    }
    recentActivities.sort(
      (x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()
    );

    return NextResponse.json({
      stats: {
        totalRevenue,
        revenueGrowth,
        totalOrders: orders.length,
        pendingOrders,
        totalBooks: books.length,
        lowStockCount: lowStockBooks.length,
        totalArticles: Number(articlesCountRes.count || 0),
      },
      revenueData,
      topSellingBooks,
      lowStockBooks,
      recentActivities: recentActivities.slice(0, 8),
    });
  } catch (err: any) {
    console.error("GET /api/admin/dashboard error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allBooks } from "@/data/books";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "relevance";
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    try {
      const adminSupabase = createAdminClient();
      let query = (adminSupabase.from("books") as any)
        .select("*, categories(name_ta, name_en, slug)")
        .eq("is_active", true);

      if (category && category !== "all") {
        query = query.eq("categories.slug", category);
      }

      const cleanSearch = search.trim().replace(/[(),%]/g, "");
      if (cleanSearch) {
        query = query.or(
          `title.ilike.%${cleanSearch}%,author.ilike.%${cleanSearch}%,slug.ilike.%${cleanSearch}%`
        );
      }

      if (sort === "price-low") {
        query = query.order("price", { ascending: true });
      } else if (sort === "price-high") {
        query = query.order("price", { ascending: false });
      } else if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("sort_order", { ascending: true });
      }

      query = query.range(offset, offset + limit - 1);

      const { data: dbBooks, error } = await query;

      if (!error && dbBooks && dbBooks.length > 0) {
        return NextResponse.json({
          books: dbBooks,
          total: dbBooks.length,
          source: "database",
        }, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        });
      }
    } catch {
      // Fallback to static catalog if DB is offline
    }

    // Static fallback
    let filtered = [...allBooks];
    if (category && category !== "all") {
      filtered = filtered.filter((b) => b.categorySlug === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.titleEn.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.authorEn.toLowerCase().includes(q)
      );
    }
    if (sort === "price-low") {
      filtered.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    } else if (sort === "price-high") {
      filtered.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    }

    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      books: paginated,
      total: filtered.length,
      source: "fallback",
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err: any) {
    console.error("GET /api/books error:", err);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}

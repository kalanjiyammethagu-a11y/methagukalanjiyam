import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allBooks } from "@/data/books";
import { mapDbBookToBookItem } from "@/lib/book-mappers";

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
      const supabase = await createClient();
      const buildQuery = (bilingualSearch: boolean) => {
        const categorySelect =
          category && category !== "all"
            ? "*, categories!inner(name_ta, name_en, slug)"
            : "*, categories(name_ta, name_en, slug)";

        let qBuilder = (supabase.from("books") as any)
          .select(categorySelect)
          .eq("status", "published");

        if (category && category !== "all") {
          qBuilder = qBuilder.eq("categories.slug", category);
        }

        const cleanSearch = search.trim().replace(/[(),%]/g, "");
        if (cleanSearch) {
          qBuilder = qBuilder.or(
            bilingualSearch
              ? `title.ilike.%${cleanSearch}%,title_en.ilike.%${cleanSearch}%,title_ta.ilike.%${cleanSearch}%,author.ilike.%${cleanSearch}%,author_en.ilike.%${cleanSearch}%,author_ta.ilike.%${cleanSearch}%,slug.ilike.%${cleanSearch}%`
              : `title.ilike.%${cleanSearch}%,author.ilike.%${cleanSearch}%,slug.ilike.%${cleanSearch}%`
          );
        }

        if (sort === "price-low") {
          qBuilder = qBuilder.order("price", { ascending: true });
        } else if (sort === "price-high") {
          qBuilder = qBuilder.order("price", { ascending: false });
        } else if (sort === "newest") {
          qBuilder = qBuilder.order("created_at", { ascending: false });
        } else {
          qBuilder = qBuilder
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });
        }

        return qBuilder.range(offset, offset + limit - 1);
      };

      let { data: dbBooks, error } = await buildQuery(true);
      if (
        error &&
        (error.code === "PGRST204" ||
          error.code === "42703" ||
          String(error.message || "").includes("column"))
      ) {
        ({ data: dbBooks, error } = await buildQuery(false));
      }

      if (!error && dbBooks && dbBooks.length > 0) {
        const mappedBooks = dbBooks.map((b: any) =>
          mapDbBookToBookItem(b, allBooks.find((sb) => sb.slug === b.slug))
        );

        return NextResponse.json(
          {
            books: mappedBooks,
            total: mappedBooks.length,
            source: "database",
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
            },
          }
        );
      }
    } catch {
      // Fallback to static catalog if DB query encounters an issue
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

    return NextResponse.json(
      {
        books: paginated,
        total: filtered.length,
        source: "fallback",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    console.error("GET /api/books error:", err);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}

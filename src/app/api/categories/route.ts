import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const defaultCategories = [
  { slug: "history", name_ta: "வரலாறு", name_en: "History", sort_order: 1 },
  { slug: "archives", name_ta: "ஆவணத் தொகுப்பு", name_en: "Archives", sort_order: 2 },
  { slug: "memoirs", name_ta: "நினைவுக் குறிப்பு", name_en: "Memoirs", sort_order: 3 },
  { slug: "biographies", name_ta: "வாழ்க்கை வரலாறு", name_en: "Biographies", sort_order: 4 },
  { slug: "political", name_ta: "அரசியல்", name_en: "Political", sort_order: 5 },
];

export async function GET(req: NextRequest) {
  try {
    try {
      const supabase = await createClient();
      const { data: categories, error } = await (supabase.from("categories") as any)
        .select("id, name_ta, name_en, slug, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!error && categories && categories.length > 0) {
        return NextResponse.json({ categories }, {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        });
      }
    } catch {
      // Fallback if DB is disconnected
    }

    return NextResponse.json({ categories: defaultCategories }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json({ categories: defaultCategories });
  }
}

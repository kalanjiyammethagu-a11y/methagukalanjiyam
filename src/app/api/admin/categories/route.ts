import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { adminCategorySchema, adminCategoryUpdateSchema } from "@/lib/validators/admin";

export const dynamic = "force-dynamic";

// Fallback mock categories if DB connection is unavailable
const fallbackCategories = [
  { id: "a0000000-0000-0000-0000-000000000001", name_ta: "வரலாறு", name_en: "History", slug: "history", sort_order: 1, is_active: true, book_count: 5 },
  { id: "a0000000-0000-0000-0000-000000000002", name_ta: "ஆவணத் தொகுப்பு", name_en: "Archives", slug: "archives", sort_order: 2, is_active: true, book_count: 4 },
  { id: "a0000000-0000-0000-0000-000000000003", name_ta: "நினைவுக் குறிப்பு", name_en: "Memoirs", slug: "memoirs", sort_order: 3, is_active: true, book_count: 3 },
  { id: "a0000000-0000-0000-0000-000000000004", name_ta: "வாழ்க்கை வரலாறு", name_en: "Biographies", slug: "biographies", sort_order: 4, is_active: true, book_count: 4 },
  { id: "a0000000-0000-0000-0000-000000000005", name_ta: "அரசியல்", name_en: "Political", slug: "political", sort_order: 5, is_active: true, book_count: 4 },
];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
      const adminSupabase = createAdminClient();
      const { data: categories, error } = await (adminSupabase.from("categories") as any)
        .select("*, books(count)")
        .order("sort_order", { ascending: true });

      if (!error && categories) {
        const formatted = categories.map((cat: any) => ({
          ...cat,
          book_count: cat.books?.[0]?.count ?? cat.book_count ?? 0,
        }));
        return NextResponse.json({ categories: formatted });
      }
    } catch {
      // Supabase unavailable, return fallback categories
    }

    return NextResponse.json({ categories: fallbackCategories });
  } catch (err: any) {
    console.error("GET /api/admin/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const parseResult = adminCategorySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid category data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { name_ta, name_en, slug, sort_order, is_active } = parseResult.data;

    const generatedSlug =
      slug ||
      name_en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") ||
      `cat-${Date.now()}`;

    const adminSupabase = createAdminClient();
    const { data: newCat, error } = await (adminSupabase.from("categories") as any)
      .insert({
        name_ta,
        name_en,
        slug: generatedSlug,
        sort_order: sort_order !== undefined ? Number(sort_order) : 99,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: newCat, message: "Category created successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const parseResult = adminCategoryUpdateSchema.safeParse(updates);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid category update data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name_ta !== undefined) payload.name_ta = updates.name_ta;
    if (updates.name_en !== undefined) payload.name_en = updates.name_en;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.sort_order !== undefined) payload.sort_order = Number(updates.sort_order);
    if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);

    const adminSupabase = createAdminClient();
    const { data: updatedCat, error } = await (adminSupabase.from("categories") as any)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: updatedCat, message: "Category updated successfully" });
  } catch (err: any) {
    console.error("PATCH /api/admin/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    if (!permanent) {
      // Soft-delete: mark inactive so existing foreign keys are never broken
      const { data, error } = await (adminSupabase.from("categories") as any)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: "Category deactivated successfully", category: data });
    }

    // Hard delete: check if books reference this category first
    const { count, error: countError } = await (adminSupabase.from("books") as any)
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot permanently delete: ${count} book(s) belong to this category. Deactivate it instead.` },
        { status: 409 }
      );
    }

    const { error: delError } = await (adminSupabase.from("categories") as any)
      .delete()
      .eq("id", id);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Category permanently deleted" });
  } catch (err: any) {
    console.error("DELETE /api/admin/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

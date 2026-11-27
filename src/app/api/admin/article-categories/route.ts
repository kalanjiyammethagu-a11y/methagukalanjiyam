import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { generateAsciiSlug } from "@/lib/i18n";
import {
  BLOG_CATEGORIES_SETTINGS_KEY,
  fetchBlogCategories,
  type ManagedBlogCategory,
} from "@/lib/blog-categories";
import { z } from "zod";

export const dynamic = "force-dynamic";

const blogCategoryCreateSchema = z.object({
  name_en: z.string().trim().min(1, "English name is required").max(120),
  name_ta: z.string().trim().min(1, "Tamil name is required").max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens only").optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(9999).optional().default(10),
  is_active: z.boolean().optional().default(true),
});

const blogCategoryUpdateSchema = z.object({
  id: z.string().trim().min(1),
  name_en: z.string().trim().min(1).max(120).optional(),
  name_ta: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

async function saveCategories(
  adminSupabase: ReturnType<typeof createAdminClient>,
  categories: ManagedBlogCategory[]
) {
  const ordered = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const { error } = await (adminSupabase.from("site_settings") as any).upsert({
    key: BLOG_CATEGORIES_SETTINGS_KEY,
    value: ordered,
    updated_at: new Date().toISOString(),
  });
  return error;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();
    const categories = await fetchBlogCategories(adminSupabase);
    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error("GET /api/admin/article-categories error:", err);
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
    const parsed = blogCategoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const current = await fetchBlogCategories(adminSupabase);
    const slug = parsed.data.slug || generateAsciiSlug(parsed.data.name_en, "blog-category");

    if (current.some((c) => c.slug.toLowerCase() === slug.toLowerCase())) {
      return NextResponse.json(
        { error: `A blog category with slug "${slug}" already exists.` },
        { status: 409 }
      );
    }

    const newCat: ManagedBlogCategory = {
      id: `blog-cat-${Date.now()}`,
      slug,
      name_en: parsed.data.name_en,
      name_ta: parsed.data.name_ta,
      sort_order: parsed.data.sort_order ?? current.length + 1,
      is_active: parsed.data.is_active ?? true,
    };

    const nextList = [...current, newCat];
    const saveErr = await saveCategories(adminSupabase, nextList);
    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    revalidatePath("/blog");
    revalidatePath("/admin/articles");

    return NextResponse.json({ category: newCat, categories: nextList }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/article-categories error:", err);
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
    const parsed = blogCategoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const current = await fetchBlogCategories(adminSupabase);
    const targetIdx = current.findIndex((c) => c.id === parsed.data.id);
    if (targetIdx === -1) {
      return NextResponse.json({ error: "Blog category not found" }, { status: 404 });
    }

    const prevCat = current[targetIdx]!;
    const nextSlug = parsed.data.slug ?? prevCat.slug;
    if (
      current.some(
        (c) => c.id !== prevCat.id && c.slug.toLowerCase() === nextSlug.toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: `A blog category with slug "${nextSlug}" already exists.` },
        { status: 409 }
      );
    }

    const updatedCat: ManagedBlogCategory = {
      ...prevCat,
      ...(parsed.data.name_en !== undefined && { name_en: parsed.data.name_en }),
      ...(parsed.data.name_ta !== undefined && { name_ta: parsed.data.name_ta }),
      ...(parsed.data.slug !== undefined && { slug: parsed.data.slug }),
      ...(parsed.data.sort_order !== undefined && { sort_order: parsed.data.sort_order }),
      ...(parsed.data.is_active !== undefined && { is_active: parsed.data.is_active }),
    };

    const nextList = current.map((c, idx) => (idx === targetIdx ? updatedCat : c));
    const saveErr = await saveCategories(adminSupabase, nextList);
    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    // Keep matching blog_posts synchronized when a category name changes
    if (updatedCat.name_en !== prevCat.name_en || updatedCat.name_ta !== prevCat.name_ta) {
      await (adminSupabase.from("blog_posts") as any)
        .update({
          category_en: updatedCat.name_en,
          category_ta: updatedCat.name_ta,
          updated_at: new Date().toISOString(),
        })
        .eq("category_en", prevCat.name_en);
    }

    revalidatePath("/blog");
    revalidatePath("/admin/articles");

    return NextResponse.json({ category: updatedCat, categories: nextList });
  } catch (err: any) {
    console.error("PATCH /api/admin/article-categories error:", err);
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
    if (!id) {
      return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const current = await fetchBlogCategories(adminSupabase);
    const target = current.find((c) => c.id === id);
    if (!target) {
      return NextResponse.json({ error: "Blog category not found" }, { status: 404 });
    }

    if (current.length <= 1) {
      return NextResponse.json(
        { error: "At least one blog category must remain active." },
        { status: 400 }
      );
    }

    const nextList = current.filter((c) => c.id !== id);
    const saveErr = await saveCategories(adminSupabase, nextList);
    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    revalidatePath("/blog");
    revalidatePath("/admin/articles");

    return NextResponse.json({ success: true, categories: nextList });
  } catch (err: any) {
    console.error("DELETE /api/admin/article-categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

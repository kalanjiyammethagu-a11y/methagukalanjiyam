import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { adminBookSchema, adminBookUpdateSchema } from "@/lib/validators/admin";
import { deleteAdminAsset } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();
    const { data: books, error } = await (adminSupabase.from("books") as any)
      .select("*, categories (name_ta, name_en, slug)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch admin books:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ books: books || [] });
  } catch (err: any) {
    console.error("GET /api/admin/books error:", err);
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
    const parsed = adminBookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const generatedSlug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") ||
      `book-${Date.now()}`;

    const adminSupabase = createAdminClient();
    const coverUrl = data.cover_image_url || data.cover_front || "/images/books/book-placeholder.webp";

    const { data: newBook, error } = await (adminSupabase.from("books") as any)
      .insert({
        title: data.title,
        slug: generatedSlug,
        author: data.author,
        description: data.description || null,
        price: data.price,
        discount_price: data.discount_price ?? null,
        stock: data.stock,
        category_id: data.category_id || null,
        cover_front: coverUrl,
        cover_image_url: coverUrl,
        cover_image_path: data.cover_image_path || null,
        whatsapp_link: data.whatsapp_link || null,
        isbn: data.isbn || null,
        pages: data.pages || null,
        publisher: data.publisher || "மேதகு களஞ்சியம்",
        published_year: data.published_year || new Date().getFullYear(),
        weight_grams: data.weight_grams || 350,
        is_featured: Boolean(data.is_featured),
        status: data.status || "published",
        is_active: data.status === "published",
        sort_order: data.sort_order ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert book:", error);
      // Clean up orphaned storage object if insert fails
      if (data.cover_image_path) {
        await deleteAdminAsset("books", data.cover_image_path);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate public caches
    revalidatePath("/books");
    revalidatePath(`/books/${generatedSlug}`);
    revalidatePath("/");

    return NextResponse.json({ book: newBook, message: "Book created successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/books error:", err);
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
    const parsed = adminBookUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const adminSupabase = createAdminClient();

    // Fetch existing book to handle old image cleanup
    const { data: existingBook } = await (adminSupabase.from("books") as any)
      .select("cover_image_path, slug")
      .eq("id", id)
      .maybeSingle();

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.author !== undefined) payload.author = updates.author;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.discount_price !== undefined) payload.discount_price = updates.discount_price;
    if (updates.stock !== undefined) payload.stock = updates.stock;
    if (updates.category_id !== undefined) payload.category_id = updates.category_id;
    if (updates.cover_image_url !== undefined) {
      payload.cover_image_url = updates.cover_image_url;
      payload.cover_front = updates.cover_image_url;
    } else if (updates.cover_front !== undefined) {
      payload.cover_front = updates.cover_front;
      payload.cover_image_url = updates.cover_front;
    }
    if (updates.cover_image_path !== undefined) {
      payload.cover_image_path = updates.cover_image_path;
    }
    if (updates.whatsapp_link !== undefined) payload.whatsapp_link = updates.whatsapp_link;
    if (updates.isbn !== undefined) payload.isbn = updates.isbn;
    if (updates.pages !== undefined) payload.pages = updates.pages;
    if (updates.publisher !== undefined) payload.publisher = updates.publisher;
    if (updates.published_year !== undefined) payload.published_year = updates.published_year;
    if (updates.weight_grams !== undefined) payload.weight_grams = updates.weight_grams;
    if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
    if (updates.is_featured !== undefined) payload.is_featured = updates.is_featured;
    if (updates.status !== undefined) {
      payload.status = updates.status;
      payload.is_active = updates.status === "published";
    }

    const { data: updatedBook, error } = await (adminSupabase.from("books") as any)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update book:", error);
      // Clean up orphaned storage object if update fails
      if (updates.cover_image_path && updates.cover_image_path !== existingBook?.cover_image_path) {
        await deleteAdminAsset("books", updates.cover_image_path);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If new image was saved, delete the old image object from storage
    if (
      updates.cover_image_path &&
      existingBook?.cover_image_path &&
      updates.cover_image_path !== existingBook.cover_image_path
    ) {
      await deleteAdminAsset("books", existingBook.cover_image_path);
    }

    // Invalidate public caches
    revalidatePath("/books");
    if (existingBook?.slug) revalidatePath(`/books/${existingBook.slug}`);
    if (updatedBook?.slug) revalidatePath(`/books/${updatedBook.slug}`);
    revalidatePath("/");

    return NextResponse.json({ book: updatedBook, message: "Book updated successfully" });
  } catch (err: any) {
    console.error("PATCH /api/admin/books error:", err);
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
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check existing book and order history
    const { data: existingBook } = await (adminSupabase.from("books") as any)
      .select("id, slug, cover_image_path")
      .eq("id", id)
      .maybeSingle();

    const { count: orderItemsCount } = await (adminSupabase.from("order_items") as any)
      .select("id", { count: "exact", head: true })
      .eq("book_id", id);

    if (orderItemsCount && orderItemsCount > 0 && !permanent) {
      // Soft-delete to draft/inactive to preserve order referential integrity
      const { data, error } = await (adminSupabase.from("books") as any)
        .update({ status: "draft", is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      revalidatePath("/books");
      if (existingBook?.slug) revalidatePath(`/books/${existingBook.slug}`);
      revalidatePath("/");

      return NextResponse.json({
        message: `Book moved to draft status to protect ${orderItemsCount} historical order record(s).`,
        deactivated: true,
        book: data,
      });
    }

    const { error } = await (adminSupabase.from("books") as any).delete().eq("id", id);

    if (error) {
      console.error("Failed to delete book:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Delete associated storage object
    if (existingBook?.cover_image_path) {
      await deleteAdminAsset("books", existingBook.cover_image_path);
    }

    revalidatePath("/books");
    if (existingBook?.slug) revalidatePath(`/books/${existingBook.slug}`);
    revalidatePath("/");

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/books error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

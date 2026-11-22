import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAdminSession } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

async function checkAdmin(req: NextRequest) {
  const adminCookie = req.cookies.get("mk_admin_session")?.value;
  if (!adminCookie) return false;
  const { valid } = await validateAdminSession(adminCookie);
  return valid;
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: books, error } = await (adminSupabase.from("books") as any)
      .select("*, categories (name_ta, name_en, slug)")
      .order("sort_order", { ascending: true });

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
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      slug,
      author,
      description,
      price,
      discount_price,
      stock,
      category_id,
      cover_front,
      pages,
      publisher,
      published_year,
      weight_grams,
      is_featured,
      is_active,
    } = body;

    if (!title || !author || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Title, author, price, and stock are required." },
        { status: 400 }
      );
    }

    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") ||
      `book-${Date.now()}`;

    const adminSupabase = createAdminClient();
    const { data: newBook, error } = await (adminSupabase.from("books") as any)
      .insert({
        title,
        slug: generatedSlug,
        author,
        description: description || null,
        price: Number(price),
        discount_price: discount_price ? Number(discount_price) : null,
        stock: Number(stock),
        category_id: category_id || null,
        cover_front: cover_front || "/images/books/book-placeholder.webp",
        pages: pages ? Number(pages) : null,
        publisher: publisher || "மேதகு களஞ்சியம்",
        published_year: published_year ? Number(published_year) : new Date().getFullYear(),
        weight_grams: weight_grams ? Number(weight_grams) : 350,
        is_featured: Boolean(is_featured),
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        sort_order: 99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert book:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ book: newBook, message: "Book created successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/books error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.author !== undefined) payload.author = updates.author;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.discount_price !== undefined)
      payload.discount_price = updates.discount_price ? Number(updates.discount_price) : null;
    if (updates.stock !== undefined) payload.stock = Number(updates.stock);
    if (updates.category_id !== undefined) payload.category_id = updates.category_id;
    if (updates.cover_front !== undefined) payload.cover_front = updates.cover_front;
    if (updates.pages !== undefined) payload.pages = Number(updates.pages);
    if (updates.publisher !== undefined) payload.publisher = updates.publisher;
    if (updates.published_year !== undefined) payload.published_year = Number(updates.published_year);
    if (updates.weight_grams !== undefined) payload.weight_grams = Number(updates.weight_grams);
    if (updates.is_featured !== undefined) payload.is_featured = Boolean(updates.is_featured);
    if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);

    const adminSupabase = createAdminClient();
    const { data: updatedBook, error } = await (adminSupabase.from("books") as any)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update book:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ book: updatedBook, message: "Book updated successfully" });
  } catch (err: any) {
    console.error("PATCH /api/admin/books error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check if historical order records reference this book
    const { count: orderItemsCount } = await (adminSupabase.from("order_items") as any)
      .select("id", { count: "exact", head: true })
      .eq("book_id", id);

    if (orderItemsCount && orderItemsCount > 0 && !permanent) {
      // Soft-delete to protect referential integrity and order history
      const { data, error } = await (adminSupabase.from("books") as any)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        message: `Book deactivated successfully to protect ${orderItemsCount} historical order record(s).`,
        deactivated: true,
        book: data,
      });
    }

    const { error } = await (adminSupabase.from("books") as any).delete().eq("id", id);

    if (error) {
      console.error("Failed to delete book:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/books error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { adminBookCreateSchema, adminBookUpdateSchema } from "@/lib/validators/admin";
import { deleteAdminAsset } from "@/lib/storage";
import {
  extractBookGalleryPaths,
  normalizeGalleryImages,
  sanitizeBookStoragePath,
} from "@/lib/book-images";
import { generateAsciiSlug, resolveBilingualPair } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();
    const { data: books, error } = await (adminSupabase.from("books") as any)
      .select("*, categories (id, name_ta, name_en, slug)")
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

function isMissingBookColumnError(error: any): boolean {
  const msg = String(error?.message || "");
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    msg.includes("gallery_images") ||
    msg.includes("cover_is_front") ||
    msg.includes("cover_alt_") ||
    msg.includes("title_") ||
    msg.includes("author_") ||
    msg.includes("description_") ||
    msg.includes("publisher_") ||
    msg.includes("quote_")
  );
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const parsed = adminBookCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const titlePair = resolveBilingualPair({
      en: data.title_en,
      ta: data.title_ta,
      legacy: data.title,
    });
    const authorPair = resolveBilingualPair({
      en: data.author_en,
      ta: data.author_ta,
      legacy: data.author,
    });
    const descPair = resolveBilingualPair({
      en: data.description_en,
      ta: data.description_ta,
      legacy: data.description,
    });
    const pubPair = resolveBilingualPair({
      en: data.publisher_en,
      ta: data.publisher_ta,
      legacy: data.publisher,
    });

    const primaryTitle = titlePair.ta || titlePair.en || data.title?.trim() || "Untitled Book";
    const primaryAuthor = authorPair.ta || authorPair.en || data.author?.trim() || "Saanthi Nesakaram";
    const primaryDesc = descPair.ta || descPair.en || data.description || null;
    const primaryPub = pubPair.ta || pubPair.en || data.publisher || "மேதகு களஞ்சியம்";

    // Strict ASCII slug from English title (no Tamil script in slugs)
    const generatedSlug =
      data.slug || generateAsciiSlug(titlePair.en || data.title_en || data.title, "book");

    const adminSupabase = createAdminClient();
    const coverUrl = (data.cover_image_url || data.cover_front || "").trim();
    const coverPath = sanitizeBookStoragePath(data.cover_image_path);
    const normalizedGallery = normalizeGalleryImages(data.gallery_images, null, coverUrl);

    const basePayload: Record<string, any> = {
      title: primaryTitle,
      slug: generatedSlug,
      author: primaryAuthor,
      description: primaryDesc,
      price: data.price,
      discount_price: data.discount_price ?? null,
      stock: data.stock,
      category_id: data.category_id || null,
      cover_front: coverUrl,
      cover_image_url: coverUrl,
      cover_image_path: coverPath,
      whatsapp_link: data.whatsapp_link || null,
      isbn: data.isbn || null,
      pages: data.pages || null,
      publisher: primaryPub,
      published_year: data.published_year || new Date().getFullYear(),
      weight_grams: data.weight_grams || 350,
      is_featured: Boolean(data.is_featured),
      status: data.status || "published",
      is_active: data.status === "published",
      sort_order: data.sort_order ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const fullPayload: Record<string, any> = {
      ...basePayload,
      title_en: titlePair.en || null,
      title_ta: titlePair.ta || null,
      author_en: authorPair.en || null,
      author_ta: authorPair.ta || null,
      description_en: descPair.en || null,
      description_ta: descPair.ta || null,
      publisher_en: pubPair.en || "Methagu Kalanjiyam",
      publisher_ta: pubPair.ta || "மேதகு களஞ்சியம்",
      quote_en: data.quote_en || null,
      quote_ta: data.quote_ta || null,
      cover_is_front: data.cover_is_front ?? true,
      cover_alt_en: data.cover_alt_en || null,
      cover_alt_ta: data.cover_alt_ta || null,
      gallery_images: normalizedGallery,
    };

    let { data: newBook, error } = await (adminSupabase.from("books") as any)
      .insert(fullPayload)
      .select("*, categories (id, name_ta, name_en, slug)")
      .single();

    if (error && isMissingBookColumnError(error)) {
      const retry = await (adminSupabase.from("books") as any)
        .insert(basePayload)
        .select("*, categories (id, name_ta, name_en, slug)")
        .single();
      newBook = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Failed to insert book:", error);
      // Clean up orphaned uploaded storage objects only because DB insert failed
      if (coverPath) {
        await deleteAdminAsset("books", coverPath);
      }
      for (const galleryPath of extractBookGalleryPaths(normalizedGallery)) {
        if (galleryPath !== coverPath) {
          await deleteAdminAsset("books", galleryPath);
        }
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

    // Fetch existing book to handle safe post-save storage cleanup
    let { data: existingBook, error: existingErr } = await (adminSupabase.from("books") as any)
      .select("cover_image_path, cover_image_url, cover_front, gallery_images, slug")
      .eq("id", id)
      .maybeSingle();

    if (existingErr && isMissingBookColumnError(existingErr)) {
      const legacyLookup = await (adminSupabase.from("books") as any)
        .select("cover_image_path, cover_image_url, cover_front, slug")
        .eq("id", id)
        .maybeSingle();
      existingBook = legacyLookup.data;
    }

    const basePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined || updates.title_ta !== undefined || updates.title_en !== undefined) {
      const legacyTitle = updates.title_ta || updates.title || updates.title_en;
      if (legacyTitle) basePayload.title = legacyTitle;
    }
    if (updates.slug !== undefined) basePayload.slug = updates.slug;
    if (updates.author !== undefined || updates.author_ta !== undefined || updates.author_en !== undefined) {
      const legacyAuthor = updates.author_ta || updates.author || updates.author_en;
      if (legacyAuthor) basePayload.author = legacyAuthor;
    }
    if (updates.description !== undefined || updates.description_ta !== undefined || updates.description_en !== undefined) {
      basePayload.description = updates.description_ta || updates.description || updates.description_en || null;
    }
    if (updates.price !== undefined) basePayload.price = updates.price;
    if (updates.discount_price !== undefined) basePayload.discount_price = updates.discount_price;
    if (updates.stock !== undefined) basePayload.stock = updates.stock;
    if (updates.category_id !== undefined) basePayload.category_id = updates.category_id;
    if (updates.cover_image_url !== undefined) {
      basePayload.cover_image_url = updates.cover_image_url;
      basePayload.cover_front = updates.cover_image_url;
    } else if (updates.cover_front !== undefined) {
      basePayload.cover_front = updates.cover_front;
      basePayload.cover_image_url = updates.cover_front;
    }
    const cleanNewCoverPath =
      updates.cover_image_path !== undefined
        ? sanitizeBookStoragePath(updates.cover_image_path)
        : undefined;
    if (cleanNewCoverPath !== undefined) {
      basePayload.cover_image_path = cleanNewCoverPath;
    }
    if (updates.whatsapp_link !== undefined) basePayload.whatsapp_link = updates.whatsapp_link;
    if (updates.isbn !== undefined) basePayload.isbn = updates.isbn;
    if (updates.pages !== undefined) basePayload.pages = updates.pages;
    if (updates.publisher !== undefined) basePayload.publisher = updates.publisher;
    if (updates.published_year !== undefined) basePayload.published_year = updates.published_year;
    if (updates.weight_grams !== undefined) basePayload.weight_grams = updates.weight_grams;
    if (updates.sort_order !== undefined) basePayload.sort_order = updates.sort_order;
    if (updates.is_featured !== undefined) basePayload.is_featured = updates.is_featured;
    if (updates.status !== undefined) {
      basePayload.status = updates.status;
      basePayload.is_active = updates.status === "published";
    }

    const effectiveCoverUrl =
      basePayload.cover_image_url ||
      existingBook?.cover_image_url ||
      existingBook?.cover_front ||
      null;
    const normalizedGallery =
      updates.gallery_images !== undefined
        ? normalizeGalleryImages(updates.gallery_images, null, effectiveCoverUrl)
        : undefined;

    const fullPayload: Record<string, any> = { ...basePayload };
    if (updates.title_en !== undefined) fullPayload.title_en = updates.title_en;
    if (updates.title_ta !== undefined) fullPayload.title_ta = updates.title_ta;
    if (updates.author_en !== undefined) fullPayload.author_en = updates.author_en;
    if (updates.author_ta !== undefined) fullPayload.author_ta = updates.author_ta;
    if (updates.description_en !== undefined) fullPayload.description_en = updates.description_en;
    if (updates.description_ta !== undefined) fullPayload.description_ta = updates.description_ta;
    if (updates.publisher_en !== undefined) fullPayload.publisher_en = updates.publisher_en;
    if (updates.publisher_ta !== undefined) fullPayload.publisher_ta = updates.publisher_ta;
    if (updates.quote_en !== undefined) fullPayload.quote_en = updates.quote_en;
    if (updates.quote_ta !== undefined) fullPayload.quote_ta = updates.quote_ta;
    if (updates.cover_is_front !== undefined) fullPayload.cover_is_front = updates.cover_is_front;
    else if (updates.cover_image_url !== undefined) fullPayload.cover_is_front = true;
    if (updates.cover_alt_en !== undefined) fullPayload.cover_alt_en = updates.cover_alt_en;
    if (updates.cover_alt_ta !== undefined) fullPayload.cover_alt_ta = updates.cover_alt_ta;
    if (normalizedGallery !== undefined) fullPayload.gallery_images = normalizedGallery;

    let { data: updatedBook, error } = await (adminSupabase.from("books") as any)
      .update(fullPayload)
      .eq("id", id)
      .select("*, categories (id, name_ta, name_en, slug)")
      .single();

    if (error && isMissingBookColumnError(error)) {
      const retry = await (adminSupabase.from("books") as any)
        .update(basePayload)
        .eq("id", id)
        .select("*, categories (id, name_ta, name_en, slug)")
        .single();
      updatedBook = retry.data;
      error = retry.error;
    }

    const oldCoverPath = sanitizeBookStoragePath(existingBook?.cover_image_path);
    const oldGalleryPaths = extractBookGalleryPaths(
      normalizeGalleryImages(existingBook?.gallery_images)
    );
    const newGalleryPaths =
      normalizedGallery !== undefined
        ? extractBookGalleryPaths(normalizedGallery)
        : oldGalleryPaths;
    const finalCoverPath =
      cleanNewCoverPath !== undefined ? cleanNewCoverPath : oldCoverPath;

    if (error) {
      console.error("Failed to update book:", error);
      // Clean up newly uploaded objects that failed to save
      if (cleanNewCoverPath && cleanNewCoverPath !== oldCoverPath && !oldGalleryPaths.includes(cleanNewCoverPath)) {
        await deleteAdminAsset("books", cleanNewCoverPath);
      }
      if (normalizedGallery !== undefined) {
        for (const p of newGalleryPaths) {
          if (p !== oldCoverPath && !oldGalleryPaths.includes(p) && p !== finalCoverPath) {
            await deleteAdminAsset("books", p);
          }
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Post-save cleanup ONLY after DB update succeeded:
    // 1. Delete old front cover only if replaced AND no longer referenced by gallery
    if (
      cleanNewCoverPath !== undefined &&
      oldCoverPath &&
      cleanNewCoverPath !== oldCoverPath &&
      !newGalleryPaths.includes(oldCoverPath)
    ) {
      await deleteAdminAsset("books", oldCoverPath);
    }
    // 2. Delete gallery objects removed during edit (if not reused as front cover)
    if (normalizedGallery !== undefined) {
      for (const oldPath of oldGalleryPaths) {
        if (!newGalleryPaths.includes(oldPath) && oldPath !== finalCoverPath) {
          await deleteAdminAsset("books", oldPath);
        }
      }
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
    let { data: existingBook, error: existingErr } = await (adminSupabase.from("books") as any)
      .select("id, slug, cover_image_path, gallery_images")
      .eq("id", id)
      .maybeSingle();

    if (existingErr && isMissingBookColumnError(existingErr)) {
      const legacyLookup = await (adminSupabase.from("books") as any)
        .select("id, slug, cover_image_path")
        .eq("id", id)
        .maybeSingle();
      existingBook = legacyLookup.data;
    }

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

    // Delete associated storage objects (front cover + gallery images)
    const deletedPaths = new Set<string>();
    const coverPath = sanitizeBookStoragePath(existingBook?.cover_image_path);
    if (coverPath) deletedPaths.add(coverPath);
    for (const gp of extractBookGalleryPaths(normalizeGalleryImages(existingBook?.gallery_images))) {
      deletedPaths.add(gp);
    }
    for (const storagePath of deletedPaths) {
      await deleteAdminAsset("books", storagePath);
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

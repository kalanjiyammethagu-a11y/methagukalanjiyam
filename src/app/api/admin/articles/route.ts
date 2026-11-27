import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { adminBlogPostCreateSchema, adminBlogPostUpdateSchema } from "@/lib/validators/admin";
import { deleteAdminAsset } from "@/lib/storage";
import { generateAsciiSlug, resolveBilingualPair } from "@/lib/i18n";
import { getSupabaseStorageUrl } from "@/lib/book-images";
import {
  mergeBlogPostsAndLegacyBlogs,
  normalizeLegacyBlogRow,
  resolveArticleCategoryPair,
} from "@/lib/blog-utils";

export const dynamic = "force-dynamic";

function isMissingArticleColumnError(error: any): boolean {
  const msg = String(error?.message || "");
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    msg.includes("title_") ||
    msg.includes("excerpt_") ||
    msg.includes("body_") ||
    msg.includes("author_") ||
    msg.includes("category_") ||
    msg.includes("seo_title_") ||
    msg.includes("seo_description_") ||
    msg.includes("cover_alt_")
  );
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();

    // Fetch both modern blog_posts and legacy blogs tables in parallel, merging non-duplicate slugs
    const [{ data: blogPosts, error }, { data: legacyBlogs, error: legacyErr }] = await Promise.all([
      (adminSupabase.from("blog_posts") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false }),
      (adminSupabase.from("blogs") as any)
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (error && legacyErr) {
      console.warn("Failed to fetch admin articles from Supabase:", error, legacyErr);
      return NextResponse.json({ error: error.message || legacyErr.message }, { status: 500 });
    }

    const merged = mergeBlogPostsAndLegacyBlogs(blogPosts || [], legacyBlogs || []);
    return NextResponse.json({ articles: merged });
  } catch (err: any) {
    console.error("GET /api/admin/articles error:", err);
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
    const parsed = adminBlogPostCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const titlePair = resolveBilingualPair({ en: data.title_en, ta: data.title_ta, legacy: data.title });
    const excerptPair = resolveBilingualPair({ en: data.excerpt_en, ta: data.excerpt_ta, legacy: data.excerpt });
    const bodyPair = resolveBilingualPair({ en: data.body_en, ta: data.body_ta, legacy: data.body });
    const authorPair = resolveBilingualPair({ en: data.author_en, ta: data.author_ta, legacy: data.author });
    const catPair = resolveArticleCategoryPair(data.category_en, data.category_ta);

    const primaryTitle = titlePair.ta || titlePair.en || data.title || "Untitled Article";
    const primaryBody = bodyPair.ta || bodyPair.en || data.body || "";
    const primaryExcerpt = excerptPair.ta || excerptPair.en || data.excerpt || null;
    const primaryAuthor = authorPair.ta || authorPair.en || data.author || "மேதகு களஞ்சியம்";

    const generatedSlug =
      data.slug || generateAsciiSlug(titlePair.en || data.title_en || titlePair.ta || data.title, "article");

    const adminSupabase = createAdminClient();
    const coverUrl = data.cover_image_url || getSupabaseStorageUrl("blog", "thalapathi-vinayagam-banner.webp");
    const publishedAt = data.published_at || (data.status === "published" ? new Date().toISOString() : null);

    const basePayload = {
      title: primaryTitle,
      slug: generatedSlug,
      excerpt: primaryExcerpt,
      body: primaryBody,
      author: primaryAuthor,
      cover_image_url: coverUrl,
      cover_image_path: data.cover_image_path || null,
      status: data.status || "published",
      sort_order: data.sort_order ?? 0,
      published_at: publishedAt,
      seo_title: data.seo_title_en || data.seo_title || titlePair.en || null,
      seo_description: data.seo_description_en || data.seo_description || excerptPair.en || null,
      reading_time_mins: data.reading_time_mins ?? 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const fullPayload = {
      ...basePayload,
      title_en: titlePair.en || null,
      title_ta: titlePair.ta || null,
      excerpt_en: excerptPair.en || null,
      excerpt_ta: excerptPair.ta || null,
      body_en: bodyPair.en || null,
      body_ta: bodyPair.ta || null,
      author_en: authorPair.en || null,
      author_ta: authorPair.ta || null,
      category_en: catPair.en,
      category_ta: catPair.ta,
      seo_title_en: data.seo_title_en || data.seo_title || null,
      seo_title_ta: data.seo_title_ta || null,
      seo_description_en: data.seo_description_en || data.seo_description || null,
      seo_description_ta: data.seo_description_ta || null,
      cover_alt_en: data.cover_alt_en || null,
      cover_alt_ta: data.cover_alt_ta || null,
    };

    // Try inserting into blog_posts table (with schema fallback if migration 019 pending)
    let { data: newPost, error } = await (adminSupabase.from("blog_posts") as any)
      .insert(fullPayload)
      .select()
      .single();

    if (error && isMissingArticleColumnError(error)) {
      const retry = await (adminSupabase.from("blog_posts") as any)
        .insert(basePayload)
        .select()
        .single();
      newPost = retry.data;
      error = retry.error;
    }

    if (error) {
      // If blog_posts table isn't migrated yet, try legacy blogs table
      const { data: legacyPost, error: legacyErr } = await (adminSupabase.from("blogs") as any)
        .insert({
          title: primaryTitle,
          title_en: titlePair.en || null,
          title_ta: titlePair.ta || null,
          slug: generatedSlug,
          excerpt: primaryExcerpt,
          excerpt_en: excerptPair.en || null,
          excerpt_ta: excerptPair.ta || null,
          content: {
            body: primaryBody,
            body_en: bodyPair.en || null,
            body_ta: bodyPair.ta || null,
            author_en: authorPair.en || null,
            author_ta: authorPair.ta || null,
            category_en: catPair.en,
            category_ta: catPair.ta,
          },
          cover_image: coverUrl,
          cover_alt_en: data.cover_alt_en || null,
          cover_alt_ta: data.cover_alt_ta || null,
          post_type: "article",
          is_published: data.status === "published",
          published_at: publishedAt,
          reading_time_mins: data.reading_time_mins ?? 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (legacyErr) {
        console.error("Failed to insert article in both blog_posts and blogs:", legacyErr);
        if (data.cover_image_path) {
          await deleteAdminAsset("blog", data.cover_image_path);
        }
        return NextResponse.json({ error: error.message || legacyErr.message }, { status: 500 });
      }

      revalidatePath("/blog");
      revalidatePath(`/blog/${generatedSlug}`);
      revalidatePath("/");

      return NextResponse.json(
        { article: normalizeLegacyBlogRow(legacyPost), message: "Article created successfully" },
        { status: 201 }
      );
    }

    revalidatePath("/blog");
    revalidatePath(`/blog/${generatedSlug}`);
    revalidatePath("/");

    return NextResponse.json(
      { article: newPost, message: "Article created successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/articles error:", err);
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
    const parsed = adminBlogPostUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const adminSupabase = createAdminClient();

    // Check existing for storage cleanup
    const { data: existingPost } = await (adminSupabase.from("blog_posts") as any)
      .select("cover_image_path, slug")
      .eq("id", id)
      .maybeSingle();

    const basePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined || updates.title_ta !== undefined || updates.title_en !== undefined) {
      const legacyTitle = updates.title_ta || updates.title || updates.title_en;
      if (legacyTitle) basePayload.title = legacyTitle;
    }
    if (updates.slug !== undefined) basePayload.slug = updates.slug;
    if (updates.excerpt !== undefined || updates.excerpt_ta !== undefined || updates.excerpt_en !== undefined) {
      basePayload.excerpt = updates.excerpt_ta || updates.excerpt || updates.excerpt_en || null;
    }
    if (updates.body !== undefined || updates.body_ta !== undefined || updates.body_en !== undefined) {
      const legacyBody = updates.body_ta || updates.body || updates.body_en;
      if (legacyBody !== undefined) basePayload.body = legacyBody;
    }
    if (updates.author !== undefined || updates.author_ta !== undefined || updates.author_en !== undefined) {
      const legacyAuthor = updates.author_ta || updates.author || updates.author_en;
      if (legacyAuthor) basePayload.author = legacyAuthor;
    }
    if (updates.cover_image_url !== undefined) basePayload.cover_image_url = updates.cover_image_url;
    if (updates.cover_image_path !== undefined) basePayload.cover_image_path = updates.cover_image_path;
    if (updates.status !== undefined) {
      basePayload.status = updates.status;
      if (basePayload.status === "published" && !updates.published_at) {
        basePayload.published_at = new Date().toISOString();
      }
    }
    if (updates.published_at !== undefined) basePayload.published_at = updates.published_at;
    if (updates.sort_order !== undefined) basePayload.sort_order = updates.sort_order;
    if (updates.reading_time_mins !== undefined) basePayload.reading_time_mins = updates.reading_time_mins;
    if (updates.seo_title !== undefined || updates.seo_title_en !== undefined) {
      basePayload.seo_title = updates.seo_title_en || updates.seo_title;
    }
    if (updates.seo_description !== undefined || updates.seo_description_en !== undefined) {
      basePayload.seo_description = updates.seo_description_en || updates.seo_description;
    }

    const fullPayload: Record<string, any> = { ...basePayload };
    if (updates.title_en !== undefined) fullPayload.title_en = updates.title_en;
    if (updates.title_ta !== undefined) fullPayload.title_ta = updates.title_ta;
    if (updates.excerpt_en !== undefined) fullPayload.excerpt_en = updates.excerpt_en;
    if (updates.excerpt_ta !== undefined) fullPayload.excerpt_ta = updates.excerpt_ta;
    if (updates.body_en !== undefined) fullPayload.body_en = updates.body_en;
    if (updates.body_ta !== undefined) fullPayload.body_ta = updates.body_ta;
    if (updates.author_en !== undefined) fullPayload.author_en = updates.author_en;
    if (updates.author_ta !== undefined) fullPayload.author_ta = updates.author_ta;
    if (updates.category_en !== undefined) fullPayload.category_en = updates.category_en;
    if (updates.category_ta !== undefined) fullPayload.category_ta = updates.category_ta;
    if (updates.seo_title_en !== undefined) fullPayload.seo_title_en = updates.seo_title_en;
    if (updates.seo_title_ta !== undefined) fullPayload.seo_title_ta = updates.seo_title_ta;
    if (updates.seo_description_en !== undefined) fullPayload.seo_description_en = updates.seo_description_en;
    if (updates.seo_description_ta !== undefined) fullPayload.seo_description_ta = updates.seo_description_ta;
    if (updates.cover_alt_en !== undefined) fullPayload.cover_alt_en = updates.cover_alt_en;
    if (updates.cover_alt_ta !== undefined) fullPayload.cover_alt_ta = updates.cover_alt_ta;

    let { data: updatedPost, error } = await (adminSupabase.from("blog_posts") as any)
      .update(fullPayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error && isMissingArticleColumnError(error)) {
      const retry = await (adminSupabase.from("blog_posts") as any)
        .update(basePayload)
        .eq("id", id)
        .select()
        .maybeSingle();
      updatedPost = retry.data;
      error = retry.error;
    }

    if (error || !updatedPost) {
      // Fallback to legacy blogs table (preserving bilingual fields inside row & JSONB content)
      const { data: existingLegacy } = await (adminSupabase.from("blogs") as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      const existingContent =
        existingLegacy?.content && typeof existingLegacy.content === "object"
          ? existingLegacy.content
          : {};

      const legacyPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined || updates.title_ta !== undefined || updates.title_en !== undefined) {
        legacyPayload.title = updates.title_ta || updates.title || updates.title_en;
      }
      if (updates.title_en !== undefined) legacyPayload.title_en = updates.title_en;
      if (updates.title_ta !== undefined) legacyPayload.title_ta = updates.title_ta;
      if (updates.slug !== undefined) legacyPayload.slug = updates.slug;
      if (updates.excerpt !== undefined || updates.excerpt_ta !== undefined || updates.excerpt_en !== undefined) {
        legacyPayload.excerpt = updates.excerpt_ta || updates.excerpt || updates.excerpt_en || null;
      }
      if (updates.excerpt_en !== undefined) legacyPayload.excerpt_en = updates.excerpt_en;
      if (updates.excerpt_ta !== undefined) legacyPayload.excerpt_ta = updates.excerpt_ta;
      if (updates.cover_alt_en !== undefined) legacyPayload.cover_alt_en = updates.cover_alt_en;
      if (updates.cover_alt_ta !== undefined) legacyPayload.cover_alt_ta = updates.cover_alt_ta;
      if (updates.seo_title_en !== undefined || updates.seo_title !== undefined) {
        legacyPayload.meta_title = updates.seo_title_en || updates.seo_title;
      }
      if (updates.seo_description_en !== undefined || updates.seo_description !== undefined) {
        legacyPayload.meta_description = updates.seo_description_en || updates.seo_description;
      }

      if (
        updates.body !== undefined ||
        updates.body_en !== undefined ||
        updates.body_ta !== undefined ||
        updates.author_en !== undefined ||
        updates.author_ta !== undefined ||
        updates.category_en !== undefined ||
        updates.category_ta !== undefined
      ) {
        const mergedContent = {
          ...existingContent,
          body:
            updates.body_ta ||
            updates.body ||
            updates.body_en ||
            existingContent.body ||
            existingContent.html ||
            "",
          ...(updates.body_en !== undefined ? { body_en: updates.body_en } : {}),
          ...(updates.body_ta !== undefined ? { body_ta: updates.body_ta } : {}),
          ...(updates.author_en !== undefined ? { author_en: updates.author_en } : {}),
          ...(updates.author_ta !== undefined ? { author_ta: updates.author_ta } : {}),
          ...(updates.category_en !== undefined ? { category_en: updates.category_en } : {}),
          ...(updates.category_ta !== undefined ? { category_ta: updates.category_ta } : {}),
        };
        legacyPayload.content = mergedContent;
      }

      if (updates.cover_image_url !== undefined) legacyPayload.cover_image = updates.cover_image_url;
      if (updates.status !== undefined) {
        legacyPayload.is_published = updates.status === "published";
        if (legacyPayload.is_published) legacyPayload.published_at = new Date().toISOString();
      }
      if (updates.reading_time_mins !== undefined) legacyPayload.reading_time_mins = updates.reading_time_mins;

      const { data: updatedLegacy, error: legacyErr } = await (adminSupabase.from("blogs") as any)
        .update(legacyPayload)
        .eq("id", id)
        .select()
        .single();

      if (legacyErr) {
        console.error("Failed to update article:", legacyErr);
        return NextResponse.json({ error: legacyErr.message }, { status: 500 });
      }

      revalidatePath("/blog");
      if (existingLegacy?.slug) revalidatePath(`/blog/${existingLegacy.slug}`);
      if (updates.slug) revalidatePath(`/blog/${updates.slug}`);
      revalidatePath("/");

      return NextResponse.json({
        article: normalizeLegacyBlogRow(updatedLegacy),
        message: "Article updated successfully",
      });
    }

    // Clean up replaced storage object
    if (
      updates.cover_image_path &&
      existingPost?.cover_image_path &&
      updates.cover_image_path !== existingPost.cover_image_path
    ) {
      await deleteAdminAsset("blog", existingPost.cover_image_path);
    }

    revalidatePath("/blog");
    if (existingPost?.slug) revalidatePath(`/blog/${existingPost.slug}`);
    if (updatedPost?.slug) revalidatePath(`/blog/${updatedPost.slug}`);
    revalidatePath("/");

    return NextResponse.json({ article: updatedPost, message: "Article updated successfully" });
  } catch (err: any) {
    console.error("PATCH /api/admin/articles error:", err);
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
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check both tables for storage asset / slug so duplicates across tables also get deleted
    const [{ data: existingPost }, { data: existingLegacy }] = await Promise.all([
      (adminSupabase.from("blog_posts") as any)
        .select("cover_image_path, slug")
        .eq("id", id)
        .maybeSingle(),
      (adminSupabase.from("blogs") as any)
        .select("slug")
        .eq("id", id)
        .maybeSingle(),
    ]);

    const deletedSlug = existingPost?.slug || existingLegacy?.slug;

    const [{ error }, { error: legacyErr }] = await Promise.all([
      (adminSupabase.from("blog_posts") as any).delete().eq("id", id),
      (adminSupabase.from("blogs") as any).delete().eq("id", id),
    ]);

    if (deletedSlug) {
      await Promise.all([
        (adminSupabase.from("blog_posts") as any).delete().eq("slug", deletedSlug),
        (adminSupabase.from("blogs") as any).delete().eq("slug", deletedSlug),
      ]);
    }

    if (error && legacyErr) {
      console.error("Failed to delete article:", error, legacyErr);
      return NextResponse.json({ error: legacyErr.message || error.message }, { status: 500 });
    }

    if (existingPost?.cover_image_path) {
      await deleteAdminAsset("blog", existingPost.cover_image_path);
    }

    revalidatePath("/blog");
    if (deletedSlug) revalidatePath(`/blog/${deletedSlug}`);
    revalidatePath("/");

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/articles error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

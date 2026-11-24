import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { adminBlogPostSchema, adminBlogPostUpdateSchema } from "@/lib/validators/admin";
import { deleteAdminAsset } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();

    // Try modern blog_posts table first
    const { data: blogPosts, error } = await (adminSupabase.from("blog_posts") as any)
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!error && blogPosts) {
      return NextResponse.json({ articles: blogPosts });
    }

    // Fallback to legacy blogs table
    const { data: legacyBlogs, error: legacyErr } = await (adminSupabase.from("blogs") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (legacyErr && !blogPosts) {
      console.warn("Failed to fetch admin articles from Supabase:", legacyErr);
      return NextResponse.json({ error: legacyErr.message }, { status: 500 });
    }

    return NextResponse.json({ articles: legacyBlogs || [] });
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
    const parsed = adminBlogPostSchema.safeParse(body);
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
      `article-${Date.now()}`;

    const adminSupabase = createAdminClient();
    const coverUrl = data.cover_image_url || "/images/blogs/thalapathi-vinayagam-banner.webp";
    const publishedAt = data.published_at || (data.status === "published" ? new Date().toISOString() : null);

    // Try inserting into blog_posts table
    const { data: newPost, error } = await (adminSupabase.from("blog_posts") as any)
      .insert({
        title: data.title,
        slug: generatedSlug,
        excerpt: data.excerpt || null,
        body: data.body,
        author: data.author || "மேதகு களஞ்சியம்",
        cover_image_url: coverUrl,
        cover_image_path: data.cover_image_path || null,
        status: data.status || "published",
        sort_order: data.sort_order ?? 0,
        published_at: publishedAt,
        seo_title: data.seo_title || null,
        seo_description: data.seo_description || null,
        reading_time_mins: data.reading_time_mins ?? 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If blog_posts table isn't migrated yet, try legacy blogs table
      const { data: legacyPost, error: legacyErr } = await (adminSupabase.from("blogs") as any)
        .insert({
          title: data.title,
          slug: generatedSlug,
          excerpt: data.excerpt || null,
          content: { body: data.body },
          cover_image: coverUrl,
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
        { article: legacyPost, message: "Article created successfully" },
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

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.excerpt !== undefined) payload.excerpt = updates.excerpt;
    if (updates.body !== undefined) payload.body = updates.body;
    if (updates.author !== undefined) payload.author = updates.author;
    if (updates.cover_image_url !== undefined) payload.cover_image_url = updates.cover_image_url;
    if (updates.cover_image_path !== undefined) payload.cover_image_path = updates.cover_image_path;
    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (payload.status === "published" && !updates.published_at) {
        payload.published_at = new Date().toISOString();
      }
    }
    if (updates.published_at !== undefined) payload.published_at = updates.published_at;
    if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
    if (updates.reading_time_mins !== undefined) payload.reading_time_mins = updates.reading_time_mins;
    if (updates.seo_title !== undefined) payload.seo_title = updates.seo_title;
    if (updates.seo_description !== undefined) payload.seo_description = updates.seo_description;

    const { data: updatedPost, error } = await (adminSupabase.from("blog_posts") as any)
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !updatedPost) {
      // Fallback to legacy blogs table
      const legacyPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined) legacyPayload.title = updates.title;
      if (updates.slug !== undefined) legacyPayload.slug = updates.slug;
      if (updates.excerpt !== undefined) legacyPayload.excerpt = updates.excerpt;
      if (updates.body !== undefined) legacyPayload.content = { body: updates.body };
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
      if (existingPost?.slug) revalidatePath(`/blog/${existingPost.slug}`);
      if (updates.slug) revalidatePath(`/blog/${updates.slug}`);
      revalidatePath("/");

      return NextResponse.json({ article: updatedLegacy, message: "Article updated successfully" });
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

    // Check for storage asset to delete
    const { data: existingPost } = await (adminSupabase.from("blog_posts") as any)
      .select("cover_image_path, slug")
      .eq("id", id)
      .maybeSingle();

    const { error } = await (adminSupabase.from("blog_posts") as any).delete().eq("id", id);
    if (error) {
      // Try legacy table
      const { error: legacyErr } = await (adminSupabase.from("blogs") as any).delete().eq("id", id);
      if (legacyErr) {
        console.error("Failed to delete article:", legacyErr);
        return NextResponse.json({ error: legacyErr.message }, { status: 500 });
      }
    }

    if (existingPost?.cover_image_path) {
      await deleteAdminAsset("blog", existingPost.cover_image_path);
    }

    revalidatePath("/blog");
    if (existingPost?.slug) revalidatePath(`/blog/${existingPost.slug}`);
    revalidatePath("/");

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/articles error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

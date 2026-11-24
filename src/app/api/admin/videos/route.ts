import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { allVideos } from "@/data/videos";
import { adminVideoSchema, adminVideoUpdateSchema } from "@/lib/validators/admin";
import { deleteAdminAsset, verifyStorageObjectExists } from "@/lib/storage";

export const dynamic = "force-dynamic";

export interface AdminVideoItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  embed_url: string;
  video_path?: string;
  video_url?: string;
  poster_path?: string;
  poster_url: string;
  duration_seconds?: number;
  duration_formatted?: string;
  file_size_bytes?: number;
  mime_type?: string;
  sort_order: number;
  status: "draft" | "published";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// In-memory fallback
let inMemoryVideos: AdminVideoItem[] = allVideos.map((v, i) => ({
  id: v.id,
  title: v.titleTa,
  slug: `video-${v.id}`,
  description: v.descriptionTa,
  embed_url: v.embedUrl,
  poster_url: v.posterImage,
  duration_formatted: v.duration,
  sort_order: i + 1,
  status: "published",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
      const adminSupabase = createAdminClient();
      const { data, error } = await (adminSupabase.from("videos") as any)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AdminVideoItem[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          slug: row.slug || `video-${row.id}`,
          description: row.description || "",
          embed_url: row.embed_url || row.video_url || "",
          video_path: row.video_path || undefined,
          video_url: row.video_url || undefined,
          poster_path: row.poster_path || undefined,
          poster_url: row.poster_url || "/images/video-posters/1.webp",
          duration_seconds: row.duration_seconds || undefined,
          duration_formatted: row.duration_seconds
            ? `${Math.floor(row.duration_seconds / 60)}:${(row.duration_seconds % 60).toString().padStart(2, "0")}`
            : undefined,
          file_size_bytes: row.file_size_bytes || undefined,
          mime_type: row.mime_type || undefined,
          sort_order: row.sort_order ?? 0,
          status: row.status || "published",
          is_active: Boolean(row.is_active ?? true),
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        }));
        return NextResponse.json({ videos: mapped });
      }
    } catch {
      // Supabase unavailable or table empty, fallback to in-memory store
    }

    return NextResponse.json({ videos: inMemoryVideos });
  } catch (err: any) {
    console.error("GET /api/admin/videos error:", err);
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
    const parseResult = adminVideoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid video data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const val = parseResult.data;
    const slug = val.slug || slugify(val.title) || `video-${Date.now()}`;
    const embedUrl = val.embed_url || val.video_url || "";

    // If a direct storage path was provided, verify it exists in the bucket
    if (val.video_path) {
      const exists = await verifyStorageObjectExists("videos", val.video_path);
      if (!exists) {
        console.warn(`[POST /api/admin/videos] Warning: video_path ${val.video_path} not yet verified in bucket`);
      }
    }

    let createdId = `vid-${Date.now()}`;
    const nowIso = new Date().toISOString();

    try {
      const adminSupabase = createAdminClient();
      const { data, error } = await (adminSupabase.from("videos") as any)
        .insert({
          title: val.title,
          slug,
          description: val.description || null,
          embed_url: embedUrl,
          video_path: val.video_path || null,
          video_url: val.video_url || null,
          poster_path: val.poster_path || null,
          poster_url: val.poster_url,
          duration_seconds: val.duration_seconds || null,
          file_size_bytes: val.file_size_bytes || null,
          mime_type: val.mime_type || null,
          sort_order: val.sort_order ?? 0,
          status: val.status || "published",
          is_active: val.is_active ?? true,
        })
        .select()
        .single();

      if (!error && data) {
        createdId = data.id;
      }
    } catch {
      // Fallback
    }

    const newVideo: AdminVideoItem = {
      id: createdId,
      title: val.title,
      slug,
      description: val.description || "",
      embed_url: embedUrl,
      video_path: val.video_path,
      video_url: val.video_url,
      poster_path: val.poster_path,
      poster_url: val.poster_url,
      duration_seconds: val.duration_seconds,
      duration_formatted: val.duration_seconds
        ? `${Math.floor(val.duration_seconds / 60)}:${(val.duration_seconds % 60).toString().padStart(2, "0")}`
        : undefined,
      file_size_bytes: val.file_size_bytes,
      mime_type: val.mime_type,
      sort_order: val.sort_order ?? 0,
      status: val.status || "published",
      is_active: val.is_active ?? true,
      created_at: nowIso,
      updated_at: nowIso,
    };

    inMemoryVideos = [newVideo, ...inMemoryVideos];

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json(
      { video: newVideo, message: "Video published successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/videos error:", err);
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
    const parseResult = adminVideoUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid video update data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parseResult.data;

    try {
      const adminSupabase = createAdminClient();

      // Check for orphan assets to clean up if paths changed
      if (updates.video_path !== undefined || updates.poster_path !== undefined) {
        const { data: existing } = await (adminSupabase.from("videos") as any)
          .select("video_path, poster_path")
          .eq("id", id)
          .single();

        if (
          existing?.video_path &&
          updates.video_path &&
          existing.video_path !== updates.video_path
        ) {
          await deleteAdminAsset("videos", existing.video_path);
        }

        if (
          existing?.poster_path &&
          updates.poster_path &&
          existing.poster_path !== updates.poster_path
        ) {
          await deleteAdminAsset("video-posters", existing.poster_path);
        }
      }

      const supabaseUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title) supabaseUpdates.title = updates.title;
      if (updates.slug) supabaseUpdates.slug = updates.slug;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.embed_url !== undefined) supabaseUpdates.embed_url = updates.embed_url;
      if (updates.video_path !== undefined) supabaseUpdates.video_path = updates.video_path;
      if (updates.video_url !== undefined) supabaseUpdates.video_url = updates.video_url;
      if (updates.poster_path !== undefined) supabaseUpdates.poster_path = updates.poster_path;
      if (updates.poster_url !== undefined) supabaseUpdates.poster_url = updates.poster_url;
      if (updates.duration_seconds !== undefined) supabaseUpdates.duration_seconds = updates.duration_seconds;
      if (updates.file_size_bytes !== undefined) supabaseUpdates.file_size_bytes = updates.file_size_bytes;
      if (updates.mime_type !== undefined) supabaseUpdates.mime_type = updates.mime_type;
      if (updates.sort_order !== undefined) supabaseUpdates.sort_order = updates.sort_order;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.is_active !== undefined) supabaseUpdates.is_active = updates.is_active;

      if (Object.keys(supabaseUpdates).length > 0) {
        await (adminSupabase.from("videos") as any)
          .update(supabaseUpdates)
          .eq("id", id);
      }
    } catch {
      // Fallback
    }

    inMemoryVideos = inMemoryVideos.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      }
      return v;
    });

    const updated = inMemoryVideos.find((v) => v.id === id);

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json({
      video: updated,
      message: "Video updated successfully",
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/videos error:", err);
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
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    try {
      const adminSupabase = createAdminClient();
      const { data: existing } = await (adminSupabase.from("videos") as any)
        .select("video_path, poster_path")
        .eq("id", id)
        .single();

      if (existing?.video_path) {
        await deleteAdminAsset("videos", existing.video_path);
      }
      if (existing?.poster_path) {
        await deleteAdminAsset("video-posters", existing.poster_path);
      }

      await (adminSupabase.from("videos") as any).delete().eq("id", id);
    } catch {
      // Fallback
    }

    inMemoryVideos = inMemoryVideos.filter((v) => v.id !== id);

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/videos error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { adminVideoSchema, adminVideoUpdateSchema } from "@/lib/validators/admin";
import { deleteAdminAsset, verifyStorageObjectExists } from "@/lib/storage";
import { generateAsciiSlug, resolveBilingualPair } from "@/lib/i18n";
import {
  isEmbedPlatformUrl,
  normalizeVideoEmbedUrl,
  resolveVideoMedia,
  resolveVideoPosterUrl,
} from "@/lib/video-utils";

export const dynamic = "force-dynamic";

export interface AdminVideoItem {
  id: string;
  title: string;
  title_en?: string;
  title_ta?: string;
  slug: string;
  description: string;
  description_en?: string;
  description_ta?: string;
  category_en?: string;
  category_ta?: string;
  poster_alt_en?: string;
  poster_alt_ta?: string;
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

function isMissingVideoColumnError(error: any): boolean {
  const msg = String(error?.message || "");
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    msg.includes("title_") ||
    msg.includes("description_") ||
    msg.includes("category_") ||
    msg.includes("poster_alt_")
  );
}

function mapSupabaseVideoRow(row: any): AdminVideoItem {
  const titlePair = resolveBilingualPair({
    en: row.title_en,
    ta: row.title_ta,
    legacy: row.title,
  });
  const descPair = resolveBilingualPair({
    en: row.description_en,
    ta: row.description_ta,
    legacy: row.description,
  });

  const media = resolveVideoMedia({
    embed_url: row.embed_url,
    video_url: row.video_url,
    video_path: row.video_path,
  });

  return {
    id: row.id,
    title: row.title || titlePair.ta || titlePair.en || "",
    title_en: titlePair.en || "",
    title_ta: titlePair.ta || "",
    slug: row.slug || `video-${row.id}`,
    description: row.description || descPair.ta || descPair.en || "",
    description_en: descPair.en || "",
    description_ta: descPair.ta || "",
    category_en: row.category_en || undefined,
    category_ta: row.category_ta || undefined,
    poster_alt_en: row.poster_alt_en || undefined,
    poster_alt_ta: row.poster_alt_ta || undefined,
    embed_url: media.embedUrl,
    video_path: media.mode === "upload" ? row.video_path || undefined : undefined,
    video_url: media.videoUrl,
    poster_path: row.poster_path || undefined,
    poster_url: resolveVideoPosterUrl({
      poster_url: row.poster_url,
      poster_path: row.poster_path,
    }),
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
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await (adminSupabase.from("videos") as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ videos: (data || []).map(mapSupabaseVideoRow), usingFallback: false });
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }
    const parseResult = adminVideoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid video data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const val = parseResult.data;
    const titlePair = resolveBilingualPair({ en: val.title_en, ta: val.title_ta, legacy: val.title });
    const descPair = resolveBilingualPair({
      en: val.description_en,
      ta: val.description_ta,
      legacy: val.description,
    });
    const primaryTitle = titlePair.ta || titlePair.en || val.title || "Archival Video";
    const primaryDesc = descPair.ta || descPair.en || val.description || null;
    const slug = val.slug || generateAsciiSlug(titlePair.en || val.title_en || val.title, "video");
    const media = resolveVideoMedia({
      embed_url: val.embed_url,
      video_url: val.video_url,
      video_path: val.video_path,
    });
    const cleanVideoPath = media.mode === "upload" ? val.video_path?.trim() || null : null;
    const cleanVideoUrl = media.mode === "upload" ? media.videoUrl || null : null;
    const cleanEmbedUrl = media.embedUrl;

    if (cleanVideoPath) {
      const exists = await verifyStorageObjectExists("videos", cleanVideoPath);
      if (!exists) {
        console.warn(`[POST /api/admin/videos] Warning: video_path ${cleanVideoPath} not yet verified in bucket`);
      }
    }

    const adminSupabase = createAdminClient();
    const baseInsert = {
      title: primaryTitle,
      slug,
      description: primaryDesc,
      embed_url: cleanEmbedUrl,
      video_path: cleanVideoPath,
      video_url: cleanVideoUrl,
      poster_path: val.poster_path?.trim() || null,
      poster_url: val.poster_url,
      duration_seconds: val.duration_seconds || null,
      file_size_bytes: media.mode === "upload" ? val.file_size_bytes || null : null,
      mime_type: media.mode === "upload" ? val.mime_type?.trim() || null : null,
      sort_order: val.sort_order ?? 0,
      status: val.status || "published",
      is_active: val.is_active ?? true,
    };
    const fullInsert = {
      ...baseInsert,
      title_en: titlePair.en || null,
      title_ta: titlePair.ta || null,
      description_en: descPair.en || null,
      description_ta: descPair.ta || null,
      category_en: val.category_en || null,
      category_ta: val.category_ta || null,
      poster_alt_en: val.poster_alt_en || null,
      poster_alt_ta: val.poster_alt_ta || null,
    };

    let { data: createdRow, error: insertError } = await (adminSupabase.from("videos") as any)
      .insert(fullInsert)
      .select()
      .single();

    if (insertError && isMissingVideoColumnError(insertError)) {
      const retry = await (adminSupabase.from("videos") as any)
        .insert(baseInsert)
        .select()
        .single();
      createdRow = retry.data;
      insertError = retry.error;
    }

    if (insertError || !createdRow) {
      console.error("POST /api/admin/videos insert failed:", insertError?.message);
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Failed to save video in Supabase database.",
        },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {}

    return NextResponse.json(
      { video: mapSupabaseVideoRow(createdRow), message: "Video published successfully" },
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }
    const parseResult = adminVideoUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid video update data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parseResult.data;
    const adminSupabase = createAdminClient();

    if (updates.video_path !== undefined || updates.poster_path !== undefined) {
      const { data: existing } = await (adminSupabase.from("videos") as any)
        .select("video_path, poster_path")
        .eq("id", id)
        .maybeSingle();

      const nextVideoPath = updates.video_path?.trim() || null;
      if (existing?.video_path && updates.video_path !== undefined && existing.video_path !== nextVideoPath) {
        await deleteAdminAsset("videos", existing.video_path);
      }

      const nextPosterPath = updates.poster_path?.trim() || null;
      if (existing?.poster_path && updates.poster_path !== undefined && existing.poster_path !== nextPosterPath) {
        await deleteAdminAsset("video-posters", existing.poster_path);
      }
    }

    const baseUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title || updates.title_ta || updates.title_en) {
      baseUpdates.title = updates.title_ta || updates.title || updates.title_en;
    }
    if (updates.slug) baseUpdates.slug = updates.slug;
    if (updates.description !== undefined || updates.description_ta !== undefined || updates.description_en !== undefined) {
      baseUpdates.description = updates.description_ta ?? updates.description ?? updates.description_en;
    }
    if (updates.embed_url !== undefined) {
      baseUpdates.embed_url = updates.embed_url ? normalizeVideoEmbedUrl(updates.embed_url) : "";
    }
    if (updates.video_path !== undefined) {
      baseUpdates.video_path = updates.video_path?.trim() || null;
    }
    if (updates.video_url !== undefined) {
      const cleanVid = updates.video_url?.trim() || null;
      if (cleanVid && isEmbedPlatformUrl(cleanVid)) {
        baseUpdates.embed_url = normalizeVideoEmbedUrl(cleanVid);
        baseUpdates.video_url = null;
        baseUpdates.video_path = null;
      } else {
        baseUpdates.video_url = cleanVid;
      }
    }
    if (updates.poster_path !== undefined) {
      baseUpdates.poster_path = updates.poster_path?.trim() || null;
    }
    if (updates.poster_url !== undefined) baseUpdates.poster_url = updates.poster_url;
    if (updates.duration_seconds !== undefined) baseUpdates.duration_seconds = updates.duration_seconds;
    if (updates.file_size_bytes !== undefined) baseUpdates.file_size_bytes = updates.file_size_bytes;
    if (updates.mime_type !== undefined) baseUpdates.mime_type = updates.mime_type;
    if (updates.sort_order !== undefined) baseUpdates.sort_order = updates.sort_order;
    if (updates.status !== undefined) baseUpdates.status = updates.status;
    if (updates.is_active !== undefined) baseUpdates.is_active = updates.is_active;

    const fullUpdates: any = { ...baseUpdates };
    if (updates.title_en !== undefined) fullUpdates.title_en = updates.title_en;
    if (updates.title_ta !== undefined) fullUpdates.title_ta = updates.title_ta;
    if (updates.description_en !== undefined) fullUpdates.description_en = updates.description_en;
    if (updates.description_ta !== undefined) fullUpdates.description_ta = updates.description_ta;
    if (updates.category_en !== undefined) fullUpdates.category_en = updates.category_en;
    if (updates.category_ta !== undefined) fullUpdates.category_ta = updates.category_ta;
    if (updates.poster_alt_en !== undefined) fullUpdates.poster_alt_en = updates.poster_alt_en;
    if (updates.poster_alt_ta !== undefined) fullUpdates.poster_alt_ta = updates.poster_alt_ta;

    let { data: updatedRow, error: updErr } = await (adminSupabase.from("videos") as any)
      .update(fullUpdates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updErr && isMissingVideoColumnError(updErr)) {
      const retry = await (adminSupabase.from("videos") as any)
        .update(baseUpdates)
        .eq("id", id)
        .select()
        .maybeSingle();
      updatedRow = retry.data;
      updErr = retry.error;
    }

    if (updErr) {
      return NextResponse.json(
        { error: updErr.message || "Failed to update video in Supabase." },
        { status: 500 }
      );
    }

    if (!updatedRow) {
      return NextResponse.json(
        { error: "Video record not found in Supabase database." },
        { status: 404 }
      );
    }

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      video: mapSupabaseVideoRow(updatedRow),
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

    const adminSupabase = createAdminClient();
    const { data: existing } = await (adminSupabase.from("videos") as any)
      .select("video_path, poster_path")
      .eq("id", id)
      .maybeSingle();

    if (existing?.video_path) {
      await deleteAdminAsset("videos", existing.video_path);
    }
    if (existing?.poster_path) {
      await deleteAdminAsset("video-posters", existing.poster_path);
    }

    const { error: deleteErr } = await (adminSupabase.from("videos") as any).delete().eq("id", id);
    if (deleteErr) {
      return NextResponse.json(
        { error: deleteErr.message || "Failed to delete video from Supabase." },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/videos error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

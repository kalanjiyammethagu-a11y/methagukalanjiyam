import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { adminSupporterCreateSchema, adminSupporterUpdateSchema } from "@/lib/validators/admin";
import { deleteAdminAsset } from "@/lib/storage";
import type { AdminSupporter } from "@/types/admin";
import { resolveBilingualPair } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function isMissingSupporterColumnError(error: any): boolean {
  const msg = String(error?.message || "");
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    msg.includes("name_") ||
    msg.includes("tagline_") ||
    msg.includes("description_") ||
    msg.includes("photo_alt_")
  );
}

function mapSupabaseSupporterRow(row: any): AdminSupporter {
  const namePair = resolveBilingualPair({
    en: row.name_en,
    ta: row.name_ta,
    legacy: row.name,
  });
  const taglinePair = resolveBilingualPair({
    en: row.tagline_en,
    ta: row.tagline_ta,
    legacy: row.tagline,
  });
  const descPair = resolveBilingualPair({
    en: row.description_en,
    ta: row.description_ta,
    legacy: row.description,
  });

  return {
    id: row.id,
    nameEn: namePair.en || row.name || "",
    nameTa: namePair.ta || "",
    roleEn: row.role_en || descPair.en || "Archival Contributor",
    roleTa: row.role_ta || "",
    taglineEn: taglinePair.en || undefined,
    taglineTa: taglinePair.ta || undefined,
    descriptionEn: descPair.en || undefined,
    descriptionTa: descPair.ta || undefined,
    photoAltEn: row.photo_alt_en || undefined,
    photoAltTa: row.photo_alt_ta || undefined,
    image:
      row.logo_or_photo_url ||
      row.avatar_url ||
      "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/harvin.webp",
    logo_or_photo_path: row.logo_or_photo_path || undefined,
    logo_or_photo_url: row.logo_or_photo_url || undefined,
    website_url: row.website_url || undefined,
    tagline: row.tagline || undefined,
    description: row.description || undefined,
    sort_order: row.sort_order ?? 0,
    status: row.status || (row.is_active ? "published" : "draft"),
    instagramUrl: row.website_url || undefined,
    whatsappUrl: undefined,
    isActive: Boolean(row.is_active ?? true),
    joinedAt: row.created_at ? row.created_at.split("T")[0] : "2024-01-01",
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await (adminSupabase.from("supporters") as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ supporters: (data || []).map(mapSupabaseSupporterRow) });
  } catch (err: any) {
    console.error("GET /api/admin/supporters error:", err);
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
    const parseResult = adminSupporterCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid supporter data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const val = parseResult.data;
    const namePair = resolveBilingualPair({
      en: val.name_en || val.nameEn,
      ta: val.name_ta || val.nameTa,
      legacy: val.name,
    });
    const descPair = resolveBilingualPair({
      en: val.description_en,
      ta: val.description_ta,
      legacy: val.description,
    });
    const taglinePair = resolveBilingualPair({
      en: val.tagline_en,
      ta: val.tagline_ta,
      legacy: val.tagline,
    });

    const name = namePair.en || namePair.ta || val.name || "Archive Supporter";
    const roleEn = val.role_en || val.roleEn || descPair.en || "Archival Contributor";
    const roleTa = val.role_ta || val.roleTa || "";
    const photoUrl = val.logo_or_photo_url || val.image || "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/harvin.webp";
    const photoPath = val.logo_or_photo_path || null;
    const isActive = val.isActive ?? val.is_active ?? true;
    const status = val.status || (isActive ? "published" : "draft");
    const sortOrder = val.sort_order ?? 0;
    const websiteUrl = val.website_url || val.instagramUrl || null;

    const adminSupabase = createAdminClient();
    const baseInsert = {
      name,
      role_en: roleEn,
      role_ta: roleTa || null,
      tagline: taglinePair.ta || taglinePair.en || null,
      description: descPair.en || descPair.ta || roleEn,
      logo_or_photo_path: photoPath,
      logo_or_photo_url: photoUrl,
      avatar_url: photoUrl,
      website_url: websiteUrl,
      sort_order: sortOrder,
      status,
      is_active: isActive,
    };
    const fullInsert = {
      ...baseInsert,
      name_en: namePair.en || null,
      name_ta: namePair.ta || null,
      tagline_en: taglinePair.en || null,
      tagline_ta: taglinePair.ta || null,
      description_en: descPair.en || null,
      description_ta: descPair.ta || null,
      photo_alt_en: val.photo_alt_en || null,
      photo_alt_ta: val.photo_alt_ta || null,
    };

    let { data: createdRow, error: insertErr } = await (adminSupabase.from("supporters") as any)
      .insert(fullInsert)
      .select()
      .single();

    if (insertErr && isMissingSupporterColumnError(insertErr)) {
      const retry = await (adminSupabase.from("supporters") as any)
        .insert(baseInsert)
        .select()
        .single();
      createdRow = retry.data;
      insertErr = retry.error;
    }

    if (insertErr || !createdRow) {
      return NextResponse.json(
        { error: insertErr?.message || "Failed to create supporter in Supabase." },
        { status: 500 }
      );
    }

    const newSupporter: AdminSupporter = mapSupabaseSupporterRow(createdRow);

    try {
      revalidatePath("/supporters");
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json(
      { supporter: newSupporter, message: "Member created successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/supporters error:", err);
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
    const parseResult = adminSupporterUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid supporter update data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { id, ...updates } = parseResult.data;

    // Try Supabase update
    try {
      const adminSupabase = createAdminClient();

      // Check if image is being replaced and clean up orphan file
      if (updates.logo_or_photo_path !== undefined) {
        const { data: existing } = await (adminSupabase.from("supporters") as any)
          .select("logo_or_photo_path")
          .eq("id", id)
          .single();

        if (
          existing?.logo_or_photo_path &&
          existing.logo_or_photo_path !== updates.logo_or_photo_path &&
          existing.logo_or_photo_path.startsWith("supporters/")
        ) {
          await deleteAdminAsset("supporters", existing.logo_or_photo_path);
        }
      }

      const baseUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      const nameEnVal = updates.name_en ?? updates.nameEn;
      const nameTaVal = updates.name_ta ?? updates.nameTa;
      if (nameEnVal || nameTaVal || updates.name) {
        baseUpdates.name = nameEnVal || nameTaVal || updates.name;
      }
      if (updates.role_en !== undefined || updates.roleEn !== undefined) {
        baseUpdates.role_en = updates.role_en ?? updates.roleEn;
      }
      if (updates.role_ta !== undefined || updates.roleTa !== undefined) {
        baseUpdates.role_ta = updates.role_ta ?? updates.roleTa;
      }
      if (updates.tagline !== undefined || updates.tagline_en !== undefined || updates.tagline_ta !== undefined) {
        baseUpdates.tagline = updates.tagline_en ?? updates.tagline_ta ?? updates.tagline;
      }
      if (updates.description !== undefined || updates.description_en !== undefined || updates.description_ta !== undefined) {
        baseUpdates.description = updates.description_en ?? updates.description_ta ?? updates.description;
      }
      if (updates.logo_or_photo_path !== undefined) {
        baseUpdates.logo_or_photo_path = updates.logo_or_photo_path;
      }
      if (updates.logo_or_photo_url !== undefined || updates.image !== undefined) {
        const url = updates.logo_or_photo_url || updates.image;
        baseUpdates.logo_or_photo_url = url;
        baseUpdates.avatar_url = url;
      }
      if (updates.website_url !== undefined || updates.instagramUrl !== undefined) {
        baseUpdates.website_url = updates.website_url || updates.instagramUrl;
      }
      if (updates.sort_order !== undefined) baseUpdates.sort_order = updates.sort_order;
      if (updates.status !== undefined) baseUpdates.status = updates.status;
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        baseUpdates.is_active = updates.isActive ?? updates.is_active;
      }

      const fullUpdates: any = { ...baseUpdates };
      if (nameEnVal !== undefined) fullUpdates.name_en = nameEnVal;
      if (nameTaVal !== undefined) fullUpdates.name_ta = nameTaVal;
      if (updates.tagline_en !== undefined) fullUpdates.tagline_en = updates.tagline_en;
      if (updates.tagline_ta !== undefined) fullUpdates.tagline_ta = updates.tagline_ta;
      if (updates.description_en !== undefined) fullUpdates.description_en = updates.description_en;
      if (updates.description_ta !== undefined) fullUpdates.description_ta = updates.description_ta;
      if (updates.photo_alt_en !== undefined) fullUpdates.photo_alt_en = updates.photo_alt_en;
      if (updates.photo_alt_ta !== undefined) fullUpdates.photo_alt_ta = updates.photo_alt_ta;

      let { data: updatedRow, error: updError } = await (adminSupabase.from("supporters") as any)
        .update(fullUpdates)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (updError && isMissingSupporterColumnError(updError)) {
        const retry = await (adminSupabase.from("supporters") as any)
          .update(baseUpdates)
          .eq("id", id)
          .select()
          .maybeSingle();
        updatedRow = retry.data;
        updError = retry.error;
      }

      if (updError) {
        return NextResponse.json({ error: updError.message || "Failed to update supporter." }, { status: 500 });
      }
      if (!updatedRow) {
        return NextResponse.json({ error: "Supporter not found in database." }, { status: 404 });
      }

      try {
        revalidatePath("/supporters");
        revalidatePath("/");
      } catch {}
      return NextResponse.json({
        supporter: mapSupabaseSupporterRow(updatedRow),
        message: "Member updated successfully",
      });
    } catch (dbErr: any) {
      return NextResponse.json(
        { error: dbErr?.message || "Database error updating supporter." },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("PATCH /api/admin/supporters error:", err);
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
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Try Supabase delete with image cleanup
    try {
      const adminSupabase = createAdminClient();
      const { data: existing } = await (adminSupabase.from("supporters") as any)
        .select("logo_or_photo_path")
        .eq("id", id)
        .single();

      if (existing?.logo_or_photo_path && existing.logo_or_photo_path.startsWith("supporters/")) {
        await deleteAdminAsset("supporters", existing.logo_or_photo_path);
      }

      const { error: delErr } = await (adminSupabase.from("supporters") as any).delete().eq("id", id);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    } catch (dbErr: any) {
      return NextResponse.json({ error: dbErr?.message || "Failed to delete supporter." }, { status: 500 });
    }

    try {
      revalidatePath("/supporters");
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json({ success: true, message: "Member deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/supporters error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

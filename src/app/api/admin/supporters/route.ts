import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { mockSupporters } from "@/data/admin-mock";
import { adminSupporterSchema, adminSupporterUpdateSchema } from "@/lib/validators/admin";
import { deleteAdminAsset } from "@/lib/storage";
import type { AdminSupporter } from "@/types/admin";

export const dynamic = "force-dynamic";

// In-memory store for fallback/dev/mock mode so edits persist within server lifecycle
let inMemorySupporters: AdminSupporter[] = [...mockSupporters];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
      const adminSupabase = createAdminClient();
      const { data, error } = await (adminSupabase.from("supporters") as any)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // Map Supabase schema to AdminSupporter model
        const mapped: AdminSupporter[] = data.map((row: any) => ({
          id: row.id,
          nameEn: row.name,
          nameTa: row.name,
          roleEn: row.role_en || row.description || "Archival Contributor",
          roleTa: row.role_ta || row.description || "ஆவணப் பங்களிப்பாளர்",
          image: row.logo_or_photo_url || row.avatar_url || "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/harvin.webp",
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
        }));
        return NextResponse.json({ supporters: mapped });
      }
    } catch {
      // Supabase unavailable or table empty, fallback to in-memory store
    }

    return NextResponse.json({ supporters: inMemorySupporters });
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
    const parseResult = adminSupporterSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid supporter data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const val = parseResult.data;
    const name = val.nameEn || val.nameTa || val.name || "Archive Supporter";
    const roleEn = val.roleEn || val.role_en || val.description || "Archival Contributor";
    const roleTa = val.roleTa || val.role_ta || val.description || "ஆவணப் பங்களிப்பாளர்";
    const photoUrl = val.logo_or_photo_url || val.image || "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/harvin.webp";
    const photoPath = val.logo_or_photo_path || null;
    const isActive = val.isActive ?? val.is_active ?? true;
    const status = val.status || (isActive ? "published" : "draft");
    const sortOrder = val.sort_order ?? 0;
    const websiteUrl = val.website_url || val.instagramUrl || null;

    let createdId = `sup-${Date.now()}`;

    // Try persisting to Supabase if connected
    try {
      const adminSupabase = createAdminClient();
      const { data, error } = await (adminSupabase.from("supporters") as any)
        .insert({
          name,
          role_en: roleEn,
          role_ta: roleTa,
          tagline: val.tagline || null,
          description: val.description || roleEn,
          logo_or_photo_path: photoPath,
          logo_or_photo_url: photoUrl,
          avatar_url: photoUrl,
          website_url: websiteUrl,
          sort_order: sortOrder,
          status,
          is_active: isActive,
        })
        .select()
        .single();

      if (!error && data) {
        createdId = data.id;
      }
    } catch {
      // Fallback
    }

    const newSupporter: AdminSupporter = {
      id: createdId,
      nameEn: name,
      nameTa: name,
      roleEn,
      roleTa,
      image: photoUrl,
      logo_or_photo_path: photoPath || undefined,
      logo_or_photo_url: photoUrl,
      website_url: websiteUrl || undefined,
      tagline: val.tagline,
      description: val.description,
      sort_order: sortOrder,
      status,
      instagramUrl: websiteUrl || undefined,
      whatsappUrl: val.whatsappUrl || undefined,
      isActive,
      joinedAt: new Date().toISOString().split("T")[0],
    };

    inMemorySupporters = [newSupporter, ...inMemorySupporters];

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

      const supabaseUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.nameEn || updates.nameTa || updates.name) {
        supabaseUpdates.name = updates.nameEn || updates.nameTa || updates.name;
      }
      if (updates.roleEn || updates.role_en) {
        supabaseUpdates.role_en = updates.roleEn || updates.role_en;
      }
      if (updates.roleTa || updates.role_ta) {
        supabaseUpdates.role_ta = updates.roleTa || updates.role_ta;
      }
      if (updates.tagline !== undefined) supabaseUpdates.tagline = updates.tagline;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.logo_or_photo_path !== undefined) {
        supabaseUpdates.logo_or_photo_path = updates.logo_or_photo_path;
      }
      if (updates.logo_or_photo_url !== undefined || updates.image !== undefined) {
        const url = updates.logo_or_photo_url || updates.image;
        supabaseUpdates.logo_or_photo_url = url;
        supabaseUpdates.avatar_url = url;
      }
      if (updates.website_url !== undefined || updates.instagramUrl !== undefined) {
        supabaseUpdates.website_url = updates.website_url || updates.instagramUrl;
      }
      if (updates.sort_order !== undefined) supabaseUpdates.sort_order = updates.sort_order;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        supabaseUpdates.is_active = updates.isActive ?? updates.is_active;
      }

      if (Object.keys(supabaseUpdates).length > 0) {
        await (adminSupabase.from("supporters") as any)
          .update(supabaseUpdates)
          .eq("id", id);
      }
    } catch {
      // Fallback
    }

    inMemorySupporters = inMemorySupporters.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          ...updates,
          nameEn: updates.nameEn || updates.nameTa || s.nameEn,
          nameTa: updates.nameTa || updates.nameEn || s.nameTa,
          image: updates.logo_or_photo_url || updates.image || s.image,
          joinedAt: s.joinedAt,
        };
      }
      return s;
    });

    const updated = inMemorySupporters.find((s) => s.id === id);

    try {
      revalidatePath("/supporters");
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json({
      supporter: updated,
      message: "Member updated successfully",
    });
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

      await (adminSupabase.from("supporters") as any).delete().eq("id", id);
    } catch {
      // Fallback
    }

    inMemorySupporters = inMemorySupporters.filter((s) => s.id !== id);

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

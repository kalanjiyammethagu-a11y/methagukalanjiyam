import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import { mockSupporters } from "@/data/admin-mock";
import { adminSupporterSchema, adminSupporterUpdateSchema } from "@/lib/validators/admin";
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
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        // Map Supabase schema to AdminSupporter model
        const mapped: AdminSupporter[] = data.map((row: any) => ({
          id: row.id,
          nameEn: row.name,
          nameTa: row.name,
          roleEn: row.description || "Archival Contributor",
          roleTa: row.description || "ஆவணப் பங்களிப்பாளர்",
          image: row.avatar_url || "/images/supporters/harvin.webp",
          instagramUrl: row.instagram_url || undefined,
          whatsappUrl: row.whatsapp_url || undefined,
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

    const {
      nameEn,
      nameTa,
      roleEn,
      roleTa,
      image,
      instagramUrl,
      whatsappUrl,
      isActive,
    } = parseResult.data;

    const newSupporter: AdminSupporter = {
      id: `sup-${Date.now()}`,
      nameEn: nameEn || nameTa || "Archive Member",
      nameTa: nameTa || nameEn || "ஆவண உறுப்பினர்",
      roleEn: roleEn || "Archival Contributor",
      roleTa: roleTa || "ஆவணப் பங்களிப்பாளர்",
      image: image || "/images/supporters/harvin.webp",
      instagramUrl: instagramUrl ? instagramUrl.trim() : undefined,
      whatsappUrl: whatsappUrl ? whatsappUrl.trim() : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      joinedAt: new Date().toISOString().split("T")[0],
    };

    // Try persisting to Supabase if connected
    try {
      const adminSupabase = createAdminClient();
      await (adminSupabase.from("supporters") as any).insert({
        name: newSupporter.nameEn,
        avatar_url: newSupporter.image,
        description: newSupporter.roleEn,
        is_active: newSupporter.isActive,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Fallback
    }

    inMemorySupporters = [newSupporter, ...inMemorySupporters];

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

    inMemorySupporters = inMemorySupporters.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          ...updates,
          // Preserve joinedAt
          joinedAt: s.joinedAt,
        };
      }
      return s;
    });

    const updated = inMemorySupporters.find((s) => s.id === id);

    // Try Supabase update
    try {
      const adminSupabase = createAdminClient();
      const supabaseUpdates: any = {};
      if (updates.nameEn) supabaseUpdates.name = updates.nameEn;
      if (updates.image) supabaseUpdates.avatar_url = updates.image;
      if (updates.roleEn) supabaseUpdates.description = updates.roleEn;
      if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;

      if (Object.keys(supabaseUpdates).length > 0) {
        await (adminSupabase.from("supporters") as any)
          .update(supabaseUpdates)
          .eq("id", id);
      }
    } catch {
      // Fallback
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

    inMemorySupporters = inMemorySupporters.filter((s) => s.id !== id);

    // Try Supabase delete
    try {
      const adminSupabase = createAdminClient();
      await (adminSupabase.from("supporters") as any).delete().eq("id", id);
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, message: "Member deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/admin/supporters error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

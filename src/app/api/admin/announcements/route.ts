import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-service";
import {
  adminAnnouncementCreateSchema,
  adminAnnouncementReorderSchema,
  adminAnnouncementUpdateSchema,
} from "@/lib/validators/admin";
import { DEFAULT_ANNOUNCEMENTS_RECORDS } from "@/lib/announcements";

export const dynamic = "force-dynamic";

const SETTINGS_FALLBACK_KEY = "recent_announcements";

function isMissingAnnouncementsTableError(error: any): boolean {
  const msg = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    msg.includes("Could not find the table") ||
    msg.includes("does not exist")
  );
}

async function readFallbackAnnouncements(adminSupabase: ReturnType<typeof createAdminClient>) {
  const { data } = await (adminSupabase.from("site_settings") as any)
    .select("value")
    .eq("key", SETTINGS_FALLBACK_KEY)
    .maybeSingle();

  const items = Array.isArray(data?.value) ? data.value : DEFAULT_ANNOUNCEMENTS_RECORDS;
  return [...items].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

async function writeFallbackAnnouncements(
  adminSupabase: ReturnType<typeof createAdminClient>,
  items: any[]
) {
  const { error } = await (adminSupabase.from("site_settings") as any).upsert({
    key: SETTINGS_FALLBACK_KEY,
    value: items,
    updated_at: new Date().toISOString(),
  });
  return error;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await (adminSupabase.from("announcements") as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error && isMissingAnnouncementsTableError(error)) {
      const items = await readFallbackAnnouncements(adminSupabase);
      return NextResponse.json({ announcements: items, storage: "site_settings" });
    }

    if (error) {
      console.error("GET /api/admin/announcements error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ announcements: data || [], storage: "table" });
  } catch (err: any) {
    console.error("GET /api/admin/announcements error:", err);
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
    const parsed = adminAnnouncementCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const primaryDate =
      data.date_label?.trim() ||
      data.date_label_ta?.trim() ||
      data.date_label_en?.trim() ||
      "";
    const nowIso = new Date().toISOString();

    const payload = {
      date_label: primaryDate,
      date_label_en: data.date_label_en?.trim() || primaryDate,
      date_label_ta: data.date_label_ta?.trim() || primaryDate,
      title_en: data.title_en?.trim() || data.title_ta?.trim() || "",
      title_ta: data.title_ta?.trim() || data.title_en?.trim() || "",
      desc_en: data.desc_en?.trim() || data.desc_ta?.trim() || "",
      desc_ta: data.desc_ta?.trim() || data.desc_en?.trim() || "",
      link_url: data.link_url?.trim() || null,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const adminSupabase = createAdminClient();
    const { data: created, error } = await (adminSupabase.from("announcements") as any)
      .insert(payload)
      .select()
      .single();

    if (error && isMissingAnnouncementsTableError(error)) {
      const existing = await readFallbackAnnouncements(adminSupabase);
      const newItem = { id: crypto.randomUUID(), ...payload };
      const writeErr = await writeFallbackAnnouncements(adminSupabase, [newItem, ...existing]);
      if (writeErr) {
        return NextResponse.json({ error: writeErr.message }, { status: 500 });
      }
      revalidatePath("/blog");
      revalidatePath("/");
      return NextResponse.json({ announcement: newItem, message: "Announcement created" }, { status: 201 });
    }

    if (error) {
      console.error("POST /api/admin/announcements error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/blog");
    revalidatePath("/");

    return NextResponse.json({ announcement: created, message: "Announcement created" }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/announcements error:", err);
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
    const parsed = adminAnnouncementUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (
      updates.date_label !== undefined ||
      updates.date_label_ta !== undefined ||
      updates.date_label_en !== undefined
    ) {
      const primaryDate =
        updates.date_label?.trim() ||
        updates.date_label_ta?.trim() ||
        updates.date_label_en?.trim() ||
        "";
      payload.date_label = primaryDate;
    }
    if (updates.date_label_en !== undefined) payload.date_label_en = updates.date_label_en;
    if (updates.date_label_ta !== undefined) payload.date_label_ta = updates.date_label_ta;
    if (updates.title_en !== undefined) payload.title_en = updates.title_en || "";
    if (updates.title_ta !== undefined) payload.title_ta = updates.title_ta || "";
    if (updates.desc_en !== undefined) payload.desc_en = updates.desc_en || "";
    if (updates.desc_ta !== undefined) payload.desc_ta = updates.desc_ta || "";
    if (updates.link_url !== undefined) payload.link_url = updates.link_url?.trim() || null;
    if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
    if (updates.is_active !== undefined) payload.is_active = updates.is_active;

    const adminSupabase = createAdminClient();
    const { data: updated, error } = await (adminSupabase.from("announcements") as any)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error && isMissingAnnouncementsTableError(error)) {
      const existing = await readFallbackAnnouncements(adminSupabase);
      const next = existing.map((item: any) => (item.id === id ? { ...item, ...payload } : item));
      const matched = next.find((item: any) => item.id === id);
      if (!matched) {
        return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
      }
      const writeErr = await writeFallbackAnnouncements(adminSupabase, next);
      if (writeErr) {
        return NextResponse.json({ error: writeErr.message }, { status: 500 });
      }
      revalidatePath("/blog");
      revalidatePath("/");
      return NextResponse.json({ announcement: matched, message: "Announcement updated" });
    }

    if (error) {
      console.error("PATCH /api/admin/announcements error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/blog");
    revalidatePath("/");

    return NextResponse.json({ announcement: updated, message: "Announcement updated" });
  } catch (err: any) {
    console.error("PATCH /api/admin/announcements error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const parsed = adminAnnouncementReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: existingRows, error: listErr } = await (adminSupabase.from("announcements") as any)
      .select("id")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (listErr && isMissingAnnouncementsTableError(listErr)) {
      const existing = await readFallbackAnnouncements(adminSupabase);
      const byId = new Map(existing.map((a: any) => [a.id, a]));
      const reordered: any[] = [];
      for (const id of parsed.data.orderedIds) {
        const item = byId.get(id);
        if (item) {
          reordered.push(item);
          byId.delete(id);
        }
      }
      for (const remaining of byId.values()) {
        reordered.push(remaining);
      }
      const withOrders = reordered.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
      const writeErr = await writeFallbackAnnouncements(adminSupabase, withOrders);
      if (writeErr) {
        return NextResponse.json({ error: writeErr.message }, { status: 500 });
      }
      revalidatePath("/blog");
      revalidatePath("/");
      return NextResponse.json({ announcements: withOrders, message: "Announcement order updated" });
    }

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    const validIds = new Set<string>((existingRows || []).map((r: { id: string }) => r.id));
    const orderedIds = parsed.data.orderedIds.filter((id) => validIds.has(id));
    for (const row of existingRows || []) {
      if (!orderedIds.includes(row.id)) {
        orderedIds.push(row.id);
      }
    }

    const nowIso = new Date().toISOString();
    const updates = await Promise.all(
      orderedIds.map((id, index) =>
        (adminSupabase.from("announcements") as any)
          .update({ sort_order: index + 1, updated_at: nowIso })
          .eq("id", id)
      )
    );

    const failed = updates.find((r: any) => r.error);
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }

    const { data: refreshed } = await (adminSupabase.from("announcements") as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    revalidatePath("/blog");
    revalidatePath("/");

    return NextResponse.json({
      announcements: refreshed || [],
      message: "Announcement order updated",
    });
  } catch (err: any) {
    console.error("PUT /api/admin/announcements error:", err);
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
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { error } = await (adminSupabase.from("announcements") as any)
      .delete()
      .eq("id", id);

    if (error && isMissingAnnouncementsTableError(error)) {
      const existing = await readFallbackAnnouncements(adminSupabase);
      const next = existing.filter((item: any) => item.id !== id);
      const writeErr = await writeFallbackAnnouncements(adminSupabase, next);
      if (writeErr) {
        return NextResponse.json({ error: writeErr.message }, { status: 500 });
      }
      revalidatePath("/blog");
      revalidatePath("/");
      return NextResponse.json({ message: "Announcement deleted" });
    }

    if (error) {
      console.error("DELETE /api/admin/announcements error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/blog");
    revalidatePath("/");

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (err: any) {
    console.error("DELETE /api/admin/announcements error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

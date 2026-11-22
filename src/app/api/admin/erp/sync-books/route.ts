import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth-service";
import { getERPClient } from "@/lib/erp/erp-client";
import { logERPAudit } from "@/lib/erp/sync-queue";
import { allBooks, BookItem } from "@/data/books";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function checkAdmin(req: NextRequest) {
  const adminCookie = req.cookies.get("mk_admin_session")?.value;
  if (!adminCookie) return false;
  const { valid } = await validateAdminSession(adminCookie);
  return valid;
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const client = getERPClient();
    const health = await client.checkHealth();

    if (!health.isReachable) {
      logERPAudit({
        action: "sync_item",
        status: "offline_queued",
        message: `Catalog sync deferred: ${health.tunnelMessage || "ERP offline"}`,
      });

      return NextResponse.json({
        success: false,
        isTunnelOffline: health.isTunnelOffline,
        error: health.tunnelMessage || "ERP server is not reachable right now.",
        totalBooks: allBooks.length,
        syncedCount: 0,
      });
    }

    // Try fetching from DB first, fallback to static allBooks
    let booksToSync: Array<{
      id: string;
      title: string;
      price: number;
      description?: string;
      image?: string;
    }> = [];

    try {
      const adminSupabase = createAdminClient();
      const { data } = await (adminSupabase.from("books") as any).select("id, title, price, description, cover_front");
      if (data && data.length > 0) {
        booksToSync = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          price: b.price,
          description: b.description,
          image: b.cover_front,
        }));
      }
    } catch {}

    if (booksToSync.length === 0) {
      booksToSync = allBooks.map((b: BookItem) => ({
        id: b.id,
        title: b.titleEn || b.title,
        price: b.price,
        description: b.descriptionEn || b.descriptionTa,
        image: b.image,
      }));
    }

    let syncedCount = 0;
    const errors: string[] = [];

    for (const book of booksToSync) {
      try {
        await client.syncItem({
          item_code: `BK-${book.id.toUpperCase()}`,
          item_name: book.title,
          item_group: client.getConfig().defaultItemGroup,
          stock_uom: "Nos",
          is_stock_item: 1,
          standard_rate: book.price,
          description: book.description,
          image: book.image,
        });
        syncedCount++;
      } catch (err: any) {
        errors.push(`${book.title}: ${err.message}`);
      }
    }

    logERPAudit({
      action: "sync_item",
      status: syncedCount > 0 ? "success" : "failed",
      message: `Synced ${syncedCount}/${booksToSync.length} books into ERP Item master.`,
      details: { syncedCount, total: booksToSync.length, errors },
    });

    return NextResponse.json({
      success: true,
      totalBooks: booksToSync.length,
      syncedCount,
      errors: errors.slice(0, 5),
    });
  } catch (err: any) {
    console.error("POST /api/admin/erp/sync-books error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

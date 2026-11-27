import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-service";
import {
  aggregateERPBinStock,
  extractBookIdFromERPItemCode,
  getERPClient,
} from "@/lib/erp/erp-client";
import { logERPAudit } from "@/lib/erp/sync-queue";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ERPStockSyncItem } from "@/types/erp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = getERPClient();
    const health = await client.checkHealth();

    if (!health.isReachable) {
      await logERPAudit({
        action: "sync_item",
        status: "offline_queued",
        message: `Stock fetch deferred: ${health.tunnelMessage || "ERP offline"}`,
      });

      return NextResponse.json({
        success: false,
        isTunnelOffline: health.isTunnelOffline,
        error: health.tunnelMessage || "ERP server is not reachable right now.",
        totalBooks: 0,
        matchedCount: 0,
        updatedCount: 0,
        items: [],
      });
    }

    const bins = await client.fetchBinStock(500);
    const stockByCode = aggregateERPBinStock(bins);

    // Fetch ERP items too so item_name / slug fallback matching works even for pre-existing ERP items
    let erpItems: Array<{ item_code?: string; item_name?: string }> = [];
    try {
      erpItems = await client.fetchItems(500);
    } catch {
      erpItems = [];
    }

    const itemCodeByNormalizedName = new Map<string, string>();
    for (const item of erpItems) {
      const code = (item.item_code || "").trim().toUpperCase();
      const name = (item.item_name || "").trim().toLowerCase();
      if (code && name && !itemCodeByNormalizedName.has(name)) {
        itemCodeByNormalizedName.set(name, code);
      }
    }

    const adminSupabase = createAdminClient();
    const { data: books, error: booksErr } = await (adminSupabase.from("books") as any).select(
      "id, slug, title, title_en, stock"
    );

    if (booksErr) {
      return NextResponse.json({ error: booksErr.message }, { status: 500 });
    }

    const allBooksList: any[] = Array.isArray(books) ? books : [];
    const results: ERPStockSyncItem[] = [];
    let matchedCount = 0;
    let updatedCount = 0;

    // Build reverse lookup for BK-<UUID>
    const codeByBookId = new Map<string, string>();
    for (const code of stockByCode.keys()) {
      const bookId = extractBookIdFromERPItemCode(code);
      if (bookId) {
        codeByBookId.set(bookId, code);
      }
    }

    for (const book of allBooksList) {
      const idKey = String(book.id || "").toLowerCase();
      const slugCode = String(book.slug || "").trim().toUpperCase();
      const titleEnKey = String(book.title_en || "").trim().toLowerCase();
      const titleTaKey = String(book.title || "").trim().toLowerCase();

      const matchedCode =
        codeByBookId.get(idKey) ||
        (slugCode && stockByCode.has(slugCode) ? slugCode : undefined) ||
        (titleEnKey ? itemCodeByNormalizedName.get(titleEnKey) : undefined) ||
        (titleTaKey ? itemCodeByNormalizedName.get(titleTaKey) : undefined);

      if (!matchedCode || !stockByCode.has(matchedCode)) {
        continue;
      }

      matchedCount++;
      const newStock = stockByCode.get(matchedCode)!;
      const previousStock = Number(book.stock ?? 0);
      const changed = previousStock !== newStock;

      if (changed) {
        const { error: updateErr } = await (adminSupabase.from("books") as any)
          .update({
            stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", book.id);

        if (!updateErr) {
          updatedCount++;
          if (book.slug) {
            revalidatePath(`/books/${book.slug}`);
          }
        }
      }

      results.push({
        bookId: String(book.id),
        title: String(book.title_en || book.title || book.slug || ""),
        itemCode: matchedCode,
        previousStock,
        newStock,
        updated: changed,
      });
    }

    if (updatedCount > 0) {
      revalidatePath("/");
      revalidatePath("/books");
    }

    await logERPAudit({
      action: "sync_item",
      status: "success",
      message: `Fetched live ERP Bin stock: matched ${matchedCount}/${allBooksList.length} books, updated ${updatedCount} stock quantities.`,
      details: {
        binsFetched: bins.length,
        matchedCount,
        updatedCount,
        totalBooks: allBooksList.length,
      },
    });

    return NextResponse.json({
      success: true,
      totalBooks: allBooksList.length,
      matchedCount,
      updatedCount,
      items: results,
    });
  } catch (err: any) {
    console.error("POST /api/admin/erp/sync-stock error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch stock from ERP" }, { status: 500 });
  }
}

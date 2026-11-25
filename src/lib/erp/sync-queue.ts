/**
 * Supabase-Backed Outbox Sync Queue for ERPNext
 * Methagu Kalanjiyam Platform
 *
 * 100% Cloudflare Workers & serverless compatible (zero local filesystem / in-memory reliance).
 * Persists queue state in `public.erp_sync_queue` and audit trail in `public.audit_logs`.
 */

import { getERPClient } from "./erp-client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ERPSyncQueueItem,
  ERPAuditLogEntry,
  ERPCustomer,
  ERPSalesOrder,
} from "@/types/erp";

function mapDbRowToQueueItem(row: any): ERPSyncQueueItem {
  return {
    id: row.id,
    orderId: row.order_id || row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name || "Customer",
    customerPhone: row.customer_phone || undefined,
    customerEmail: row.customer_email || undefined,
    totalAmount: Number(row.total_amount || 0),
    itemCount: Number(row.item_count || 0),
    status: (row.status || "pending") as ERPSyncQueueItem["status"],
    retryCount: Number(row.attempts || 0),
    lastError: row.last_error || undefined,
    erpCustomerId: row.erp_customer_id || undefined,
    erpSalesOrderId: row.erp_sales_order_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    payload: row.payload || {},
  };
}

function normalizeBookItemCode(item: { item_code?: string; book_id?: string | null }): string {
  if (item.item_code && item.item_code.trim()) {
    return item.item_code.trim();
  }
  if (item.book_id && String(item.book_id).trim()) {
    return `BK-${String(item.book_id).trim().toUpperCase()}`;
  }
  return "BOOK-DEFAULT";
}

export async function logERPAudit(
  entry: Omit<ERPAuditLogEntry, "id" | "timestamp">
): Promise<void> {
  try {
    const adminSupabase = createAdminClient();
    await (adminSupabase.from("audit_logs") as any).insert({
      action: `erp_${entry.action}`,
      resource_type: "erp",
      resource_id: entry.status,
      metadata: {
        status: entry.status,
        message: entry.message,
        details: entry.details || null,
      },
    });
  } catch (err) {
    console.warn("[ERP Audit] Failed to record audit log:", err);
  }
}

async function upsertQueueRow(item: ERPSyncQueueItem): Promise<ERPSyncQueueItem> {
  const adminSupabase = createAdminClient();
  const baseRow: Record<string, any> = {
    order_id: item.orderId || null,
    order_number: item.orderNumber,
    customer_name: item.customerName || null,
    customer_phone: item.customerPhone || null,
    customer_email: item.customerEmail || null,
    total_amount: item.totalAmount || 0,
    item_count: item.itemCount || 0,
    status: item.status,
    attempts: item.retryCount || 0,
    last_error: item.lastError || null,
    payload: item.payload || {},
    updated_at: item.updatedAt || new Date().toISOString(),
  };

  const extendedRow: Record<string, any> = {
    ...baseRow,
    erp_customer_id: item.erpCustomerId || null,
    erp_sales_order_id: item.erpSalesOrderId || null,
  };

  let { data, error } = await (adminSupabase.from("erp_sync_queue") as any)
    .upsert(extendedRow, { onConflict: "order_number" })
    .select("*")
    .maybeSingle();

  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    const retry = await (adminSupabase.from("erp_sync_queue") as any)
      .upsert(baseRow, { onConflict: "order_number" })
      .select("*")
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.warn("[ERP Queue] upsertQueueRow error:", error.message);
    return item;
  }

  return data ? mapDbRowToQueueItem(data) : item;
}

/**
 * Enqueue an order for ERP synchronization in Supabase.
 */
export async function enqueueOrderSync(orderPayload: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: any;
  items: Array<{
    item_code?: string;
    book_id?: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
}): Promise<ERPSyncQueueItem> {
  const adminSupabase = createAdminClient();
  const { data: existingRow } = await (adminSupabase.from("erp_sync_queue") as any)
    .select("*")
    .eq("order_number", orderPayload.orderNumber)
    .maybeSingle();

  if (existingRow && existingRow.status === "synced") {
    return mapDbRowToQueueItem(existingRow);
  }

  const nowIso = new Date().toISOString();
  const normalizedItems = (orderPayload.items || []).map((it) => ({
    ...it,
    item_code: normalizeBookItemCode(it),
  }));

  const queueItem = await upsertQueueRow({
    id: existingRow?.id || orderPayload.orderId,
    orderId: orderPayload.orderId,
    orderNumber: orderPayload.orderNumber,
    customerName: orderPayload.customerName,
    customerPhone: orderPayload.customerPhone,
    customerEmail: orderPayload.customerEmail,
    totalAmount: orderPayload.totalAmount,
    itemCount: normalizedItems.reduce((acc, it) => acc + (it.quantity || 1), 0),
    status: "pending",
    retryCount: Number(existingRow?.attempts || 0),
    createdAt: existingRow?.created_at || nowIso,
    updatedAt: nowIso,
    payload: {
      ...orderPayload,
      items: normalizedItems,
    },
  });

  const config = getERPClient().getConfig();
  if (config.enabled && config.autoSyncOrders) {
    processQueueItem(queueItem).catch((err) => {
      console.warn(`Immediate ERP sync deferred for ${orderPayload.orderNumber}:`, err.message);
    });
  }

  return queueItem;
}

/**
 * Process a single queue item against ERPNext and update Supabase state.
 */
export async function processQueueItem(item: ERPSyncQueueItem): Promise<ERPSyncQueueItem> {
  const client = getERPClient();
  const config = client.getConfig();
  const updated: ERPSyncQueueItem = {
    ...item,
    updatedAt: new Date().toISOString(),
    retryCount: Number(item.retryCount || 0) + 1,
  };

  if (!config.enabled) {
    updated.status = "pending";
    updated.lastError = "ERP integration is disabled in runtime configuration (ERP_ENABLED=false).";
    return await upsertQueueRow(updated);
  }

  const health = await client.checkHealth();

  if (!health.isReachable) {
    if (health.isTunnelOffline) {
      updated.status = "queued_tunnel_offline";
      updated.lastError = health.tunnelMessage || "Cloudflare Tunnel Error 1033 (Origin unreachable)";
      await logERPAudit({
        action: "create_sales_order",
        status: "offline_queued",
        message: `Order ${updated.orderNumber} deferred in outbox: ${updated.lastError}`,
        details: { orderNumber: updated.orderNumber, health },
      });
    } else {
      updated.status = "failed";
      updated.lastError = health.tunnelMessage || "ERP service is unavailable.";
      await logERPAudit({
        action: "create_sales_order",
        status: "failed",
        message: `Order ${updated.orderNumber} sync attempt failed: ${updated.lastError}`,
        details: { orderNumber: updated.orderNumber, health },
      });
    }
    return await upsertQueueRow(updated);
  }

  try {
    updated.status = "processing";

    const customerPayload: ERPCustomer = {
      customer_name: updated.customerName || `Customer ${updated.orderNumber}`,
      mobile_no: updated.customerPhone,
      email_id: updated.customerEmail,
      customer_type: "Individual",
      customer_group: "Individual",
      territory: "India",
    };

    const erpCustomer = await client.findOrCreateCustomer(customerPayload);
    updated.erpCustomerId = erpCustomer.name || erpCustomer.customer_name;

    const rawItems: any[] = updated.payload?.items || [];
    const salesOrderItems = rawItems.map((it: any) => ({
      item_code: normalizeBookItemCode(it),
      item_name: it.title || it.item_name || "Tamil Literature Book",
      qty: it.quantity || 1,
      rate: it.price || it.rate || 0,
      amount: (it.price || it.rate || 0) * (it.quantity || 1),
    }));

    const salesOrderPayload: ERPSalesOrder = {
      customer: updated.erpCustomerId,
      transaction_date: new Date().toISOString().split("T")[0],
      company: config.company,
      order_type: "Sales",
      currency: "INR",
      po_no: updated.orderNumber,
      remarks: `Website Checkout: ${updated.orderNumber} | Customer: ${updated.customerName} | Phone: ${updated.customerPhone || "N/A"}`,
      items: salesOrderItems,
      grand_total: updated.totalAmount,
    };

    const erpSalesOrder = await client.createSalesOrder(salesOrderPayload);
    updated.erpSalesOrderId = erpSalesOrder.name || `SO-${updated.orderNumber}`;
    updated.status = "synced";
    updated.lastError = undefined;

    await logERPAudit({
      action: "create_sales_order",
      status: "success",
      message: `Order ${updated.orderNumber} successfully synced to ERP (Sales Order: ${updated.erpSalesOrderId}).`,
      details: { erpSalesOrderId: updated.erpSalesOrderId, erpCustomerId: updated.erpCustomerId },
    });
  } catch (syncErr: any) {
    updated.status = "failed";
    updated.lastError = syncErr.message || String(syncErr);
    await logERPAudit({
      action: "create_sales_order",
      status: "failed",
      message: `Failed to sync Order ${updated.orderNumber} into ERP: ${updated.lastError}`,
      details: { error: updated.lastError },
    });
  }

  return await upsertQueueRow(updated);
}

/**
 * Flush all pending or failed/offline-queued items stored in Supabase.
 */
export async function flushERPQueue(): Promise<{
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  isTunnelOffline: boolean;
  tunnelMessage?: string;
}> {
  const queueItems = await getERPQueueItems();
  const client = getERPClient();
  const health = await client.checkHealth();

  if (!health.isReachable) {
    await logERPAudit({
      action: "flush_queue",
      status: "offline_queued",
      message: `Flush queue halted: ${health.tunnelMessage || "ERP offline"}`,
    });

    return {
      total: queueItems.length,
      processed: 0,
      succeeded: 0,
      failed: queueItems.filter((q) => q.status !== "synced").length,
      isTunnelOffline: health.isTunnelOffline,
      tunnelMessage: health.tunnelMessage,
    };
  }

  const eligibleItems = queueItems.filter((q) => q.status !== "synced");
  let succeeded = 0;
  let failed = 0;

  for (const item of eligibleItems) {
    const res = await processQueueItem(item);
    if (res.status === "synced") succeeded++;
    else failed++;
  }

  await logERPAudit({
    action: "flush_queue",
    status: succeeded > 0 || eligibleItems.length === 0 ? "success" : "failed",
    message: `Flushed queue: ${succeeded} synced successfully, ${failed} failed.`,
  });

  return {
    total: queueItems.length,
    processed: eligibleItems.length,
    succeeded,
    failed,
    isTunnelOffline: false,
  };
}

export async function getERPQueueItems(): Promise<ERPSyncQueueItem[]> {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await (adminSupabase.from("erp_sync_queue") as any)
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error || !Array.isArray(data)) return [];
    return data.map(mapDbRowToQueueItem);
  } catch {
    return [];
  }
}

export async function getERPAuditLogs(): Promise<ERPAuditLogEntry[]> {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await (adminSupabase.from("audit_logs") as any)
      .select("id, action, resource_id, metadata, created_at")
      .eq("resource_type", "erp")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !Array.isArray(data)) return [];
    return data.map((row: any) => ({
      id: row.id,
      timestamp: row.created_at,
      action: String(row.action || "").replace(/^erp_/, "") as ERPAuditLogEntry["action"],
      status: (row.metadata?.status || row.resource_id || "success") as ERPAuditLogEntry["status"],
      message: row.metadata?.message || row.action,
      details: row.metadata?.details || undefined,
    }));
  } catch {
    return [];
  }
}

export async function getERPQueueStats() {
  const queueItems = await getERPQueueItems();
  const total = queueItems.length;
  const pending = queueItems.filter((q) => q.status === "pending").length;
  const queuedOffline = queueItems.filter((q) => q.status === "queued_tunnel_offline").length;
  const synced = queueItems.filter((q) => q.status === "synced").length;
  const failed = queueItems.filter((q) => q.status === "failed").length;

  return {
    total,
    pending,
    queuedOffline,
    synced,
    failed,
    lastSyncAt: queueItems[0]?.updatedAt || null,
  };
}

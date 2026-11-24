"use client";

import * as React from "react";
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Zap,
  Info,
  Database,
  ExternalLink,
  Code2,
  Terminal,
  Activity,
  Check,
  X,
  FileText,
} from "lucide-react";
import { ERPHealthStatus, ERPSyncQueueItem, ERPAuditLogEntry } from "@/types/erp";

export default function AdminERPPage() {
  const [health, setHealth] = React.useState<ERPHealthStatus | null>(null);
  const [config, setConfig] = React.useState<any>(null);
  const [queueItems, setQueueItems] = React.useState<ERPSyncQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<ERPAuditLogEntry[]>([]);
  const [stats, setStats] = React.useState<any>(null);

  const [loading, setLoading] = React.useState(true);
  const [testingConnection, setTestingConnection] = React.useState(false);
  const [flushingQueue, setFlushingQueue] = React.useState(false);
  const [syncingBooks, setSyncingBooks] = React.useState(false);
  const [syncingOrderId, setSyncingOrderId] = React.useState<string | null>(null);

  const [activeTab, setActiveTab] = React.useState<"all" | "queued" | "synced" | "failed">("all");
  const [inspectItem, setInspectItem] = React.useState<ERPSyncQueueItem | null>(null);
  const [notification, setNotification] = React.useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/erp/status");
      if (res.ok) {
        const data = await res.json();
        setHealth(data.health);
        setConfig(data.config);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load ERP status:", err);
    }
  }, []);

  const fetchQueue = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/erp/queue");
      if (res.ok) {
        const data = await res.json();
        setQueueItems(data.items || []);
        setAuditLogs(data.auditLogs || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load ERP queue:", err);
    }
  }, []);

  React.useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchQueue()]);
      setLoading(false);
    }
    init();
  }, [fetchStatus, fetchQueue]);

  // Test live connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setNotification(null);
    try {
      const res = await fetch("/api/admin/erp/test-connection", { method: "POST" });
      const data = await res.json();
      setHealth(data.health);
      if (data.success) {
        setNotification({
          type: "success",
          msg: `Connected successfully! Logged in as: ${data.health.loggedUser} (${data.health.latencyMs}ms)`,
        });
      } else {
        setNotification({
          type: data.health?.isTunnelOffline ? "info" : "error",
          msg: data.health?.tunnelMessage || "Connection failed. Please check ERP status.",
        });
      }
      await fetchQueue();
    } catch (err: any) {
      setNotification({ type: "error", msg: "Test connection request failed: " + err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  // Flush Queue
  const handleFlushQueue = async () => {
    setFlushingQueue(true);
    setNotification(null);
    try {
      const res = await fetch("/api/admin/erp/queue", { method: "POST" });
      const data = await res.json();
      if (data.result?.isTunnelOffline) {
        setNotification({
          type: "info",
          msg: `Queue held safely: ${data.result.tunnelMessage}. No orders lost.`,
        });
      } else {
        setNotification({
          type: "success",
          msg: `Queue processed: ${data.result.succeeded} synced, ${data.result.failed} pending.`,
        });
      }
      await Promise.all([fetchStatus(), fetchQueue()]);
    } catch (err: any) {
      setNotification({ type: "error", msg: "Flush queue request failed: " + err.message });
    } finally {
      setFlushingQueue(false);
    }
  };

  // Sync Books
  const handleSyncBooks = async () => {
    setSyncingBooks(true);
    setNotification(null);
    try {
      const res = await fetch("/api/admin/erp/sync-books", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          msg: `Successfully synced ${data.syncedCount}/${data.totalBooks} books into ERP Item master.`,
        });
      } else {
        setNotification({
          type: data.isTunnelOffline ? "info" : "error",
          msg: data.error || "Catalog sync deferred due to ERP connectivity.",
        });
      }
      await Promise.all([fetchStatus(), fetchQueue()]);
    } catch (err: any) {
      setNotification({ type: "error", msg: "Catalog sync request failed: " + err.message });
    } finally {
      setSyncingBooks(false);
    }
  };

  // Single order retry
  const handleSyncSingleOrder = async (item: ERPSyncQueueItem) => {
    setSyncingOrderId(item.id);
    try {
      const res = await fetch("/api/admin/erp/sync-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: item.orderId }),
      });
      const data = await res.json();
      if (data.success && data.item?.status === "synced") {
        setNotification({ type: "success", msg: `Order ${item.orderNumber} successfully synced to ERP!` });
      } else {
        setNotification({
          type: "info",
          msg: `Order ${item.orderNumber}: ${data.item?.lastError || "Queued for retry"}`,
        });
      }
      await Promise.all([fetchStatus(), fetchQueue()]);
    } catch (err: any) {
      setNotification({ type: "error", msg: `Sync failed for order ${item.orderNumber}: ${err.message}` });
    } finally {
      setSyncingOrderId(null);
    }
  };

  // Filter items
  const filteredItems = queueItems.filter((it) => {
    if (activeTab === "all") return true;
    if (activeTab === "queued") return it.status === "queued_tunnel_offline" || it.status === "pending";
    if (activeTab === "synced") return it.status === "synced";
    if (activeTab === "failed") return it.status === "failed";
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0A6847] text-xs font-semibold mb-1.5">
            <Server className="h-3.5 w-3.5" />
            <span>Enterprise Integration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            ERPNext Integration & Outbox Sync
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Synchronize sales orders, customers, and book catalog with Frappe / ERPNext.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Activity className={`h-4 w-4 text-emerald-600 ${testingConnection ? "animate-spin" : ""}`} />
            <span>{testingConnection ? "Pinging ERP..." : "Test Connection"}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncBooks}
            disabled={syncingBooks}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Database className={`h-4 w-4 text-blue-600 ${syncingBooks ? "animate-spin" : ""}`} />
            <span>{syncingBooks ? "Syncing..." : "Sync Books to Items"}</span>
          </button>

          <button
            type="button"
            onClick={handleFlushQueue}
            disabled={flushingQueue}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
            title="Sync all pending and offline-queued orders into ERPNext"
          >
            <RefreshCw className={`h-4 w-4 ${flushingQueue ? "animate-spin" : ""}`} />
            <span>{flushingQueue ? "சிங்க் ஆகிறது..." : "Sync Pending Orders (சிங்க் செய்க)"}</span>
            {stats && (stats.pending + stats.queuedOffline) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold">
                {stats.pending + stats.queuedOffline}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : notification.type === "info"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : notification.type === "info" ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs font-medium leading-relaxed">{notification.msg}</div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cloudflare Tunnel & Connectivity Health Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                health?.isReachable
                  ? "bg-emerald-100 text-emerald-700"
                  : health?.isTunnelOffline
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">ERP Host: erp.methagukalanjiyam.in</h3>
                {health?.isReachable ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Online & Active
                  </span>
                ) : health?.isTunnelOffline ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    Cloudflare Tunnel Offline (1033)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                    Checking Status...
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Target Endpoint: <code className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">{config?.url || "https://erp.methagukalanjiyam.in"}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>Last checked: {health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString() : "Just now"}</span>
          </div>
        </div>

        {/* Detailed Diagnostic Guide when Cloudflare Tunnel Error 1033 is present */}
        {health?.isTunnelOffline && (
          <div className="bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200/80 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Cloudflare Tunnel Connector is Offline on Origin Server (Error 1033)
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  The domain <strong className="font-semibold">erp.methagukalanjiyam.in</strong> is configured through a Cloudflare Tunnel. Cloudflare is currently unable to reach the connector on your origin server.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/80 rounded-xl p-3 border border-amber-200 text-xs text-gray-700 space-y-1">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Outbox Protection Active (Zero Order Loss)</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-normal">
                  All customer purchases and payments will continue to process smoothly on the website. Paid orders are automatically queued in the Outbox below and will push to ERP as soon as the tunnel reconnects.
                </p>
              </div>

              <div className="bg-white/80 rounded-xl p-3 border border-amber-200 text-xs text-gray-700 space-y-1">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-blue-600" />
                  <span>How to Restart Tunnel on ERP Server</span>
                </div>
                <p className="text-[11px] font-mono text-gray-600 bg-gray-100 p-1.5 rounded">
                  sudo systemctl restart cloudflared
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Outbox Queue</span>
            <span className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-2">{stats?.total || queueItems.length}</div>
          <p className="text-[11px] text-gray-400 mt-1">Total orders processed</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Queued / Offline</span>
            <span className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            {stats?.queuedOffline || queueItems.filter((q) => q.status === "queued_tunnel_offline").length}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Pending tunnel reconnection</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Synced to ERP</span>
            <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {stats?.synced || queueItems.filter((q) => q.status === "synced").length}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Sales Orders generated</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Auto-Sync Mode</span>
            <span className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </span>
          </div>
          <div className="text-lg font-extrabold text-purple-700 mt-2.5">Real-Time</div>
          <p className="text-[11px] text-gray-400 mt-1">On checkout verification</p>
        </div>
      </div>

      {/* Outbox Sync Queue Section */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Outbox Sync Queue</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live orders captured on checkout awaiting transmission or synced with ERPNext.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              All ({queueItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("queued")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "queued" ? "bg-white text-amber-700 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Queued ({queueItems.filter((q) => q.status === "queued_tunnel_offline" || q.status === "pending").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("synced")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "synced" ? "bg-white text-emerald-700 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Synced ({queueItems.filter((q) => q.status === "synced").length})
            </button>
          </div>
        </div>

        {/* Queue Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">ERP Reference</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No orders currently match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">
                      <div>{item.orderNumber}</div>
                      <div className="text-[11px] text-gray-400 font-sans font-normal">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{item.customerName}</div>
                      <div className="text-[11px] text-gray-400">{item.customerPhone || item.customerEmail || "Guest Checkout"}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900">₹{item.totalAmount}</div>
                      <div className="text-[11px] text-gray-400">{item.itemCount} item(s)</div>
                    </td>

                    <td className="px-5 py-4">
                      {item.status === "synced" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Synced
                        </span>
                      ) : item.status === "queued_tunnel_offline" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800" title={item.lastError}>
                          <Clock className="h-3 w-3 text-amber-600" />
                          Queued (Tunnel Offline)
                        </span>
                      ) : item.status === "processing" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                          <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                          Syncing...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="h-3 w-3 text-rose-600" />
                          Failed
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {item.erpSalesOrderId ? (
                        <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {item.erpSalesOrderId}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Pending ERP Assignment</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectItem(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 font-semibold text-[11px] cursor-pointer min-h-[36px]"
                        >
                          Payload
                        </button>
                        <button
                          type="button"
                          disabled={syncingOrderId === item.id}
                          onClick={() => handleSyncSingleOrder(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-[11px] transition-all cursor-pointer min-h-[36px]"
                        >
                          {syncingOrderId === item.id ? "Syncing..." : "Sync"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credentials & System Configuration Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">ERP Authentication & Credentials</h3>
          </div>

          <div className="space-y-2.5 text-xs text-gray-600">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-medium">ERP Base URL</span>
              <span className="font-mono font-semibold text-gray-900">{config?.url || "https://erp.methagukalanjiyam.in"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-medium">API Key</span>
              <span className="font-mono font-semibold text-gray-900">{config?.apiKey || "251d72274f50663"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-medium">API Secret</span>
              <span className="font-mono font-semibold text-gray-900">{config?.apiSecretMasked || "3a82••••••••db86"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-medium">Company Name</span>
              <span className="font-semibold text-gray-900">{config?.company || "Methagu Kalanjiyam"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 font-medium">Item Group</span>
              <span className="font-semibold text-gray-900">{config?.defaultItemGroup || "Books"}</span>
            </div>
          </div>
        </div>

        {/* Audit Log / Event Feed */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Activity className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Recent Sync Audit Log</h3>
            </div>
            <span className="text-[11px] text-gray-400">{auditLogs.length} events</span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No events recorded yet.</p>
            ) : (
              auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-gray-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{log.action.replace("_", " ").toUpperCase()}</span>
                    <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-normal">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inspect Payload Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">ERP Payload: {inspectItem.orderNumber}</h3>
                <p className="text-xs text-gray-500">Customer: {inspectItem.customerName} (₹{inspectItem.totalAmount})</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
                {JSON.stringify(inspectItem, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

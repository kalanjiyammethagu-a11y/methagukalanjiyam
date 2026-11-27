"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  ShoppingBag,
  BookOpen,
  FileText,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Plus,
  RefreshCw,
  Database,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface DashboardResponse {
  stats: {
    totalRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    pendingOrders: number;
    totalBooks: number;
    lowStockCount: number;
    totalArticles: number;
  };
  revenueData: Array<{ month: string; revenue: number; orders: number }>;
  topSellingBooks: Array<{ id: string; title: string; image: string; salesCount: number; revenue: number }>;
  lowStockBooks: Array<{ id: string; title: string; slug: string; stock: number }>;
  recentActivities: Array<{ id: string; type: string; description: string; timestamp: string }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<DashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [restockingId, setRestockingId] = React.useState<string | null>(null);
  const [restockedToast, setRestockedToast] = React.useState<string | null>(null);

  const fetchDashboard = React.useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || "Failed to load live dashboard metrics from Supabase.");
        return;
      }
      const json = (await res.json()) as DashboardResponse;
      setData(json);
    } catch {
      setErrorMsg("Network error loading dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleQuickRestock = async (bookId: string, currentStock: number, title: string) => {
    const nextStock = Number(currentStock || 0) + 10;
    setRestockingId(bookId);
    try {
      const res = await fetch("/api/admin/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookId, stock: nextStock }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setRestockedToast(err.error || "Failed to update stock in database.");
        setTimeout(() => setRestockedToast(null), 3500);
        return;
      }
      setRestockedToast(`"${title}" restocked +10 copies (saved to DB)`);
      setTimeout(() => setRestockedToast(null), 3000);
      await fetchDashboard();
    } catch {
      setRestockedToast("Network error updating stock.");
      setTimeout(() => setRestockedToast(null), 3500);
    } finally {
      setRestockingId(null);
    }
  };

  const stats = data?.stats;
  const revenueData = data?.revenueData || [];
  const maxMonthRev = Math.max(1, ...revenueData.map((d) => d.revenue));
  const lowStockBooks = data?.lowStockBooks || [];
  const topSellingBooks = data?.topSellingBooks || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div className="space-y-6">
      {restockedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{restockedToast}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-[#0A6847] to-[#064a32] text-white relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-emerald-200 uppercase tracking-widest">
              Methagu Kalanjiyam · Live Supabase Console
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white">
              Welcome back, Admin
            </h2>
            <p className="text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              Manage book inventory, fulfill ST Courier orders, and monitor real store metrics.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/books"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0A6847] hover:bg-emerald-50 text-sm font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Manage Books
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-sm font-bold transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              Orders
            </Link>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={fetchDashboard}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: loading ? "..." : formatINR(stats?.totalRevenue || 0),
            sub: stats ? `${stats.revenueGrowth >= 0 ? "+" : ""}${stats.revenueGrowth}% vs prior 30d` : "—",
            subColor: "text-emerald-700",
            icon: TrendingUp,
            iconBg: "bg-emerald-100 text-emerald-700",
          },
          {
            label: "Total Orders",
            value: loading ? "..." : String(stats?.totalOrders ?? 0),
            sub: `${stats?.pendingOrders ?? 0} pending`,
            subColor: "text-amber-700",
            icon: ShoppingBag,
            iconBg: "bg-blue-100 text-blue-700",
          },
          {
            label: "Catalog Books",
            value: loading ? "..." : String(stats?.totalBooks ?? 0),
            sub: `${lowStockBooks.length} low stock`,
            subColor: lowStockBooks.length > 0 ? "text-rose-700" : "text-emerald-700",
            icon: BookOpen,
            iconBg: "bg-purple-100 text-purple-700",
          },
          {
            label: "Published Articles",
            value: loading ? "..." : String(stats?.totalArticles ?? 0),
            sub: "Live in blog_posts",
            subColor: "text-gray-500",
            icon: FileText,
            iconBg: "bg-amber-100 text-amber-700",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {kpi.label}
                </span>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                {kpi.value}
              </div>
              <div className={`mt-1.5 text-xs font-semibold ${kpi.subColor}`}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Chart + Top Books */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm space-y-5 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-gray-900">Monthly Sales (Last 6 Months)</h3>
              <p className="text-xs text-gray-500 mt-0.5">Live non-cancelled order revenue from Supabase</p>
            </div>
            {(() => {
              const latestMonth = revenueData[revenueData.length - 1];
              if (!latestMonth) return null;
              return (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A6847]/10 text-[#0A6847] text-xs font-bold self-start sm:self-auto">
                  {latestMonth.month}: {formatINR(latestMonth.revenue)} (
                  {latestMonth.orders} orders)
                </span>
              );
            })()}
          </div>
          <div className="pt-2 overflow-x-auto">
            {loading ? (
              <div className="h-52 flex items-center justify-center text-xs text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading revenue data...
              </div>
            ) : (
              <div className="h-52 min-w-[260px] flex items-end justify-between gap-2 sm:gap-5 px-1 sm:px-2 border-b border-gray-200 pb-2">
                {revenueData.map((dp) => {
                  const heightPercent = Math.max(4, Math.round((dp.revenue / maxMonthRev) * 100));
                  return (
                    <div key={dp.month} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
                        {formatINR(dp.revenue)} · {dp.orders} orders
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[44px] rounded-t-xl bg-gradient-to-t from-[#0A6847] to-emerald-400 group-hover:brightness-110 transition-all shadow-sm relative"
                      >
                        <div className="absolute top-1 inset-x-0 text-center text-[9px] font-bold text-white/90 font-mono hidden sm:block">
                          {dp.orders}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-500 mt-1">{dp.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Selling */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900">Top Sellers</h3>
            <Link
              href="/admin/books"
              className="text-xs font-bold text-[#0A6847] hover:underline flex items-center gap-0.5"
            >
              All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="py-10 text-center text-xs text-gray-400">Loading order items...</div>
          ) : topSellingBooks.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500">No recorded book sales yet.</div>
          ) : (
            <div className="space-y-2">
              {topSellingBooks.map((book, idx) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="relative h-12 w-9 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-sm">
                    <Image src={book.image} alt={book.title} width={36} height={48} className="w-full h-full object-cover" />
                    <div className="absolute top-0 left-0 bg-black/60 text-white text-[9px] font-bold px-1 rounded-br">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-xs text-gray-900 truncate font-tamil">{book.title}</h4>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      {book.salesCount} copies · {formatINR(book.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Inventory Alert (Stock ≤ 5)</h3>
              <span className="text-[11px] text-rose-700 font-semibold">
                {lowStockBooks.length} book{lowStockBooks.length !== 1 ? "s" : ""} need restocking
              </span>
            </div>
          </div>
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400">Checking catalog stock...</div>
          ) : lowStockBooks.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-700 font-semibold">
              All books have healthy stock (&gt; 5 copies).
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockBooks.map((book) => (
                <div
                  key={book.id}
                  className="p-3 rounded-xl border border-gray-100 bg-rose-50/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-gray-900 truncate font-tamil">{book.title}</div>
                    <div className="text-[11px] text-rose-700 font-medium mt-0.5">
                      <span className="font-mono font-bold">{book.stock}</span> copies left
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={restockingId === book.id}
                    onClick={() => handleQuickRestock(book.id, book.stock, book.title)}
                    className="px-3 py-1.5 rounded-lg bg-[#0A6847] hover:bg-[#085036] disabled:opacity-50 text-white text-[11px] font-bold transition-all shrink-0 shadow-sm cursor-pointer"
                  >
                    {restockingId === book.id ? "..." : "+10"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900">Recent Activity</h3>
            <span className="text-[11px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
              Live DB Log
            </span>
          </div>
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading recent logs...</div>
          ) : recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No recent orders or audit events yet.</div>
          ) : (
            <div className="space-y-2.5">
              {recentActivities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-xl bg-gray-100 text-[#0A6847] flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === "order" ? (
                      <ShoppingBag className="h-4 w-4" />
                    ) : act.type === "stock_update" ? (
                      <RefreshCw className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{act.description}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">
                      {new Date(act.timestamp).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backend Status */}
      <div className="rounded-2xl p-5 border border-emerald-200 bg-emerald-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#0A6847] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-900">Supabase + ERPNext Live Bindings Active</h4>
            <p className="text-xs text-emerald-800/70 mt-0.5">
              All KPIs, inventory alerts, and order feeds above are queried directly from PostgreSQL.
            </p>
          </div>
        </div>
        <Link
          href="/admin/settings"
          className="px-4 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shrink-0 shadow-sm flex items-center gap-1.5"
        >
          Settings <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

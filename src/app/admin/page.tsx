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
} from "lucide-react";
import {
  dashboardStats,
  revenueData,
  topSellingBooks,
  recentActivities,
  mockAdminBooks,
} from "@/data/admin-mock";
import { formatINR } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [booksState, setBooksState] = React.useState(mockAdminBooks);
  const [booksSource, setBooksSource] = React.useState<"db" | "mock">("mock");
  const [restockingId, setRestockingId] = React.useState<string | null>(null);
  const [restockedToast, setRestockedToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/admin/books")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.books || !Array.isArray(data.books)) return;
        setBooksState(
          data.books.map((b: any) => ({
            ...mockAdminBooks[0],
            id: b.id,
            title: b.title_ta || b.title_en || b.title,
            titleEn: b.title_en || b.title || b.slug,
            stock: Number(b.stock || 0),
            price: Number(b.price || 0),
            status: (b.stock <= 0 ? "out_of_stock" : b.stock <= 5 ? "low_stock" : "in_stock") as any,
          }))
        );
        setBooksSource("db");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const lowStockBooks = booksState.filter((b) => b.stock <= 5);

  const handleQuickRestock = async (bookId: string, currentStock: number, title: string) => {
    const nextStock = Number(currentStock || 0) + 10;
    if (booksSource === "mock") {
      setRestockedToast(`Mock preview only: connect/sign in to Supabase DB to persist "${title}" stock.`);
      setTimeout(() => setRestockedToast(null), 3500);
      return;
    }
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
      setBooksState((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, stock: nextStock, status: "in_stock" } : b))
      );
      setRestockedToast(`"${title}" restocked +10 copies (saved to DB)`);
      setTimeout(() => setRestockedToast(null), 3000);
    } catch {
      setRestockedToast("Network error updating stock.");
      setTimeout(() => setRestockedToast(null), 3500);
    } finally {
      setRestockingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
              Methagu Kalanjiyam · Archives
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white">
              Welcome back, Admin
            </h2>
            <p className="text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              Manage book inventory, fulfill orders, and track platform analytics from one place.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/books"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0A6847] hover:bg-emerald-50 text-sm font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Add New Book
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatINR(dashboardStats.totalRevenue),
            sub: `+${dashboardStats.revenueGrowth}% this month`,
            subColor: "text-emerald-700",
            icon: TrendingUp,
            iconBg: "bg-emerald-100 text-emerald-700",
          },
          {
            label: "Total Orders",
            value: dashboardStats.totalOrders,
            sub: `${dashboardStats.pendingOrders} pending`,
            subColor: "text-amber-700",
            icon: ShoppingBag,
            iconBg: "bg-blue-100 text-blue-700",
          },
          {
            label: "Catalog Books",
            value: booksSource === "db" ? booksState.length : dashboardStats.totalBooks,
            sub: `${lowStockBooks.length} low stock`,
            subColor: "text-rose-700",
            icon: BookOpen,
            iconBg: "bg-purple-100 text-purple-700",
          },
          {
            label: "Published Articles",
            value: dashboardStats.totalArticles,
            sub: "1,240 total reads",
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-gray-900">Monthly Sales (2026)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Revenue and order volume — last 6 months</p>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A6847]/10 text-[#0A6847] text-xs font-bold">
              Oct: {formatINR(8240)} (55 orders)
            </span>
          </div>
          <div className="pt-2">
            <div className="h-52 flex items-end justify-between gap-3 sm:gap-5 px-2 border-b border-gray-200 pb-2">
              {revenueData.map((dp) => {
                const heightPercent = Math.round((dp.revenue / 10000) * 100);
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
            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2.5 px-1">
              <span>Min: ₹4,200</span>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0A6847] inline-block"></span>
                <span className="text-gray-600 font-medium">Book Revenue</span>
              </div>
              <span>Target: ₹10,000</span>
            </div>
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
          <div className="space-y-2">
            {topSellingBooks.map((book, idx) => (
              <div
                key={book.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="relative h-12 w-9 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-sm">
                  <Image src={book.image} alt={book.titleEn} width={36} height={48} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 bg-black/60 text-white text-[9px] font-bold px-1 rounded-br">
                    #{idx + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-gray-900 truncate">{book.titleEn}</h4>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {book.salesCount} copies · {formatINR(book.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Inventory Alert</h3>
              <span className="text-[11px] text-rose-700 font-semibold">
                {lowStockBooks.length} book{lowStockBooks.length !== 1 ? "s" : ""} need restocking
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {lowStockBooks.map((book) => (
              <div
                key={book.id}
                className="p-3 rounded-xl border border-gray-100 bg-rose-50/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-gray-900 truncate">{book.titleEn}</div>
                  <div className="text-[11px] text-rose-700 font-medium mt-0.5">
                    <span className="font-mono font-bold">{book.stock}</span> copies left
                  </div>
                </div>
                <button
                  type="button"
                  disabled={restockingId === book.id}
                  onClick={() => handleQuickRestock(book.id, book.stock, book.titleEn)}
                  className="px-3 py-1.5 rounded-lg bg-[#0A6847] hover:bg-[#085036] disabled:opacity-50 text-white text-[11px] font-bold transition-all shrink-0 shadow-sm cursor-pointer"
                >
                  {restockingId === book.id ? "..." : "+10"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900">Recent Activity</h3>
            <span className="text-[11px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded-lg">Live log</span>
          </div>
          <div className="space-y-2.5">
            {recentActivities.slice(0, 5).map((act) => (
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
                  <p className="text-xs font-semibold text-gray-900 leading-snug">{act.descriptionEn}</p>
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
        </div>
      </div>

      {/* Backend Status */}
      <div className="rounded-2xl p-5 border border-emerald-200 bg-emerald-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#0A6847] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-900">Backend Ready — Supabase Connected</h4>
            <p className="text-xs text-emerald-800/70 mt-0.5">
              API endpoints, schema types, and CRUD operations are live in{" "}
              <code className="font-mono text-[11px]">src/lib/api/admin-service.ts</code>.
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

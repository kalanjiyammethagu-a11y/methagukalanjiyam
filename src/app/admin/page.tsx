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
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Phone,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Database,
  Truck,
} from "lucide-react";
import {
  dashboardStats,
  revenueData,
  topSellingBooks,
  recentActivities,
  mockOrders,
  mockAdminBooks,
} from "@/data/admin-mock";
import { formatINR } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminDashboardPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  // Mock restock state
  const [booksState, setBooksState] = React.useState(mockAdminBooks);
  const [restockedToast, setRestockedToast] = React.useState<string | null>(null);

  const lowStockBooks = booksState.filter((b) => b.stock <= 5);

  const handleQuickRestock = (bookId: string, title: string) => {
    setBooksState((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, stock: b.stock + 10, status: "in_stock" } : b))
    );
    setRestockedToast(`${title} +10 ${isTa ? "பிரதிகள் இருப்பு சேர்க்கப்பட்டது!" : "copies restocked!"}`);
    setTimeout(() => setRestockedToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Restock Notification Toast */}
      {restockedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold font-tamil">{restockedToast}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-[#0A6847] to-neutral-900 text-white relative overflow-hidden shadow-xl border border-black/10">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-white/15">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              <span>{isTa ? "களஞ்சிய நிர்வாகக் குழு மையம்" : "Archives Administration HQ"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-tamil leading-tight tracking-tight text-white">
              {isTa ? "வணக்கம், களஞ்சிய நிர்வாகி!" : "Welcome back, Admin"}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-tamil max-w-2xl leading-relaxed">
              {isTa
                ? "நூல்களின் இருப்பு, வாசகர் ஆர்டர்கள், ஆவணப் பதிவுகள் மற்றும் தள விற்பனைப் புள்ளிவிவரங்களின் முழுமையான மேலாண்மைப் பலகை."
                : "Manage book catalog inventory, dispatch orders, editorial archives, and platform analytics in one place."}
            </p>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/books"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0A6847] hover:bg-emerald-50 text-xs font-bold shadow-md transition-all active:scale-95 min-h-[42px] font-tamil"
            >
              <Plus className="h-4 w-4" />
              <span>{isTa ? "புதிய நூல் சேர்க்க" : "Add New Book"}</span>
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all min-h-[42px] font-tamil"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{isTa ? "ஆர்டர்கள் காண்க" : "View Orders"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-bold font-tamil">{isTa ? "மொத்த விற்பனை வருவாய்" : "Total Revenue"}</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-[#0A6847] flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono tracking-tight">
            {formatINR(dashboardStats.totalRevenue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <span className="flex items-center text-emerald-600 font-bold">
              +{dashboardStats.revenueGrowth}%
            </span>
            <span className="text-zinc-500 font-tamil font-normal">{isTa ? "இந்த மாதம்" : "this month"}</span>
          </div>
        </div>

        {/* Metric 2: Orders */}
        <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-bold font-tamil">{isTa ? "மொத்த ஆர்டர்கள்" : "Total Orders"}</span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono tracking-tight">
            {dashboardStats.totalOrders}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 font-semibold font-tamil">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-[10px] font-bold">
              {dashboardStats.pendingOrders} {isTa ? "அனுப்பப்பட வேண்டும்" : "Pending"}
            </span>
          </div>
        </div>

        {/* Metric 3: Books */}
        <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-bold font-tamil">{isTa ? "கையிருப்பு நூல்கள்" : "Catalog Books"}</span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono tracking-tight">
            {dashboardStats.totalBooks}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-800 font-semibold font-tamil">
            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-[10px] font-bold">
              {lowStockBooks.length} {isTa ? "குறைந்த இருப்பு" : "Low Stock"}
            </span>
          </div>
        </div>

        {/* Metric 4: Articles */}
        <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-bold font-tamil">{isTa ? "ஆவணப் பதிவுகள்" : "Published Articles"}</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono tracking-tight">
            {dashboardStats.totalArticles}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 font-semibold font-tamil">
            <span>1,240 {isTa ? "வாசகர் வாசிப்புகள்" : "total reads"}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue Chart & Top Selling Books */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monthly Revenue Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-zinc-900 font-tamil">
                {isTa ? "மாதாந்திர விற்பனைப் போக்கு (2026)" : "Monthly Sales Trends (2026)"}
              </h3>
              <p className="text-xs text-zinc-500 font-tamil">
                {isTa ? "கடந்த 6 மாதங்களின் விற்பனை வருவாய் மற்றும் ஆர்டர்கள் எண்ணிக்கை" : "Revenue and order volume over the last 6 months"}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A6847]/10 text-[#0A6847] text-xs font-bold font-tamil">
              <span>{isTa ? "அக்டோபர்:" : "Oct:"} {formatINR(8240)} (55 {isTa ? "ஆர்டர்கள்" : "orders"})</span>
            </div>
          </div>

          {/* Visual Bar Chart */}
          <div className="pt-4">
            <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-black/10 pb-2">
              {revenueData.map((dp) => {
                const maxRevenue = 10000;
                const heightPercent = Math.round((dp.revenue / maxRevenue) * 100);
                return (
                  <div key={dp.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-md">
                      {formatINR(dp.revenue)} • {dp.orders} {isTa ? "ஆர்டர்கள்" : "orders"}
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-[#0A6847] to-emerald-400 group-hover:brightness-110 transition-all shadow-xs relative"
                    >
                      <div className="absolute top-1 inset-x-0 text-center text-[10px] font-bold text-white/90 font-mono hidden sm:block">
                        {dp.orders}
                      </div>
                    </div>
                    {/* Month Label */}
                    <span className="text-xs font-bold text-zinc-600 font-tamil mt-1">
                      {dp.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 px-1 font-tamil">
              <span>{isTa ? "குறைந்தபட்சம்: ₹4,200" : "Min: ₹4,200"}</span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0A6847]"></span>
                <span className="text-zinc-600 font-semibold">{isTa ? "நூல் விற்பனை வருவாய்" : "Book Revenue"}</span>
              </span>
              <span>{isTa ? "அதிகபட்சம்: ₹10,000 இலக்கு" : "Target: ₹10,000"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Top Selling Books (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-zinc-900 font-tamil">
              {isTa ? "அதிகம் விற்பனையான நூல்கள்" : "Top Selling Titles"}
            </h3>
            <Link
              href="/admin/books"
              className="text-xs font-bold text-[#0A6847] hover:underline font-tamil flex items-center gap-1"
            >
              <span>{isTa ? "அனைத்தும்" : "All"}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {topSellingBooks.map((book, idx) => (
              <div
                key={book.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 transition-colors"
              >
                <div className="relative h-12 w-9 rounded-lg overflow-hidden border border-black/10 bg-zinc-100 shrink-0 shadow-2xs">
                  <Image
                    src={book.image}
                    alt={book.title}
                    width={36}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 left-0 bg-black/60 text-white text-[9px] font-bold px-1 rounded-br">
                    #{idx + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-zinc-900 truncate font-tamil">
                    {isTa ? book.title : book.titleEn}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {book.salesCount} {isTa ? "பிரதிகள்" : "copies"} • {formatINR(book.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-rose-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 font-tamil leading-tight">
                  {isTa ? "கையிருப்பு எச்சரிக்கை" : "Inventory Stock Alert"}
                </h3>
                <span className="text-[11px] text-rose-700 font-semibold font-tamil">
                  {lowStockBooks.length} {isTa ? "நூல்கள் மறுபதிப்பு தேவை" : "books need restocking"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {lowStockBooks.map((book) => (
              <div
                key={book.id}
                className="p-3 rounded-xl border border-black/8 bg-rose-50/50 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-zinc-900 truncate font-tamil">
                    {isTa ? book.title : book.titleEn}
                  </div>
                  <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                    {isTa ? "இருப்பு:" : "Stock:"}{" "}
                    <span className="font-mono font-bold">{book.stock}</span>{" "}
                    {isTa ? "பிரதிகள் மட்டுமே!" : "copies left"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickRestock(book.id, isTa ? book.title : book.titleEn)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold font-tamil transition-all shrink-0 active:scale-95 shadow-2xs"
                >
                  +10 {isTa ? "சேர்க்க" : "Add"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-black/8 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-zinc-900 font-tamil">
              {isTa ? "சமீபத்திய நிகழ்வுகள் & செயல்பாடுகள்" : "Recent Store Activity"}
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Real-time log</span>
          </div>

          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-black/5 transition-colors"
              >
                <div className="h-8 w-8 rounded-xl bg-black/5 text-[#0A6847] flex items-center justify-center shrink-0 mt-0.5">
                  {act.type === "order" ? (
                    <ShoppingBag className="h-4 w-4" />
                  ) : act.type === "stock_update" ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-900 font-tamil leading-tight">
                    {isTa ? act.descriptionTa : act.descriptionEn}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    {new Date(act.timestamp).toLocaleString(isTa ? "ta-IN" : "en-IN", {
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

      {/* Backend Prepared Status Card */}
      <div className="rounded-2xl p-5 border border-emerald-300 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-950 font-tamil">
              {isTa
                ? "பின்னணி சேவையகம் தயார் நிலையில் உள்ளது (Supabase Architecture Prepared)"
                : "Backend Architecture Prepared (Supabase Ready)"}
            </h4>
            <p className="text-xs text-emerald-900/80 font-tamil mt-0.5">
              {isTa
                ? "API Stubs, Type Definitions, மற்றும் Database Schema கோப்புகள் தயார். எப்போது வேண்டுமானாலும் Supabase-உடன் இணைக்கலாம்."
                : "API stubs, schema types, and CRUD endpoints are built in src/lib/api/admin-service.ts. Plug-and-play ready."}
            </p>
          </div>
        </div>
        <Link
          href="/admin/settings"
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold font-tamil transition-all shrink-0 active:scale-95 shadow-xs"
        >
          {isTa ? "அமைப்புகளைக் காண்க" : "View Settings"}
        </Link>
      </div>
    </div>
  );
}

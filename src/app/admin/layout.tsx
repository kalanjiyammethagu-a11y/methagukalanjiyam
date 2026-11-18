"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Settings,
  ExternalLink,
  Menu,
  X,
  Bell,
  Search,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { locale, toggleLocale } = useLanguage();
  const isTa = locale === "ta";
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [notificationOpen, setNotificationOpen] = React.useState(false);

  // Dedicated minimal layout for admin login (no sidebar, no navbar, no marketing chrome)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    {
      href: "/admin",
      labelTa: "மேலோட்டம்",
      labelEn: "Overview",
      icon: LayoutDashboard,
      exact: true,
      badge: null,
    },
    {
      href: "/admin/orders",
      labelTa: "ஆர்டர்கள்",
      labelEn: "Orders",
      icon: ShoppingBag,
      badge: "7",
      badgeColor: "bg-amber-500/20 text-amber-800 border-amber-400/30",
    },
    {
      href: "/admin/books",
      labelTa: "நூல் மேலாண்மை",
      labelEn: "Books Catalog",
      icon: BookOpen,
      badge: "3",
      badgeColor: "bg-rose-500/20 text-rose-800 border-rose-400/30",
    },
    {
      href: "/admin/articles",
      labelTa: "களஞ்சியப் பதிவுகள்",
      labelEn: "Articles & Blog",
      icon: FileText,
      badge: null,
    },
    {
      href: "/admin/supporters",
      labelTa: "ஆதரவாளர்கள்",
      labelEn: "Supporters & Team",
      icon: Users,
      badge: null,
    },
    {
      href: "/admin/analytics",
      labelTa: "பகுப்பாய்வு",
      labelEn: "Analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      href: "/admin/settings",
      labelTa: "நிர்வாக அமைப்புகள்",
      labelEn: "Store Settings",
      icon: Settings,
      badge: null,
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1A1A1A] flex flex-col font-sans">
      {/* Top Demo Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-amber-100 px-4 py-2 text-xs font-medium flex items-center justify-between border-b border-amber-700/50 shadow-xs z-50">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
          </span>
          <span className="font-tamil font-semibold">
            {isTa
              ? "நிர்வாகக் காட்சிப்படுத்தல் பயன்முறை (Showcase Mode) — நேரடி மாதிரி தரவுகளுடன் இயங்குகிறது"
              : "Admin Showcase Mode — Loaded with realistic mock dataset, ready for Supabase backend connection"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-amber-200 hover:text-white font-semibold underline underline-offset-2 transition-colors font-tamil"
          >
            <span>{isTa ? "பொது களஞ்சியம் காண்க" : "View Public Store"}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-black/8 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Sidebar Top: Brand */}
          <div className="p-5 border-b border-black/8">
            <div className="flex items-center justify-between">
              <Link
                href="/admin"
                className="flex items-center gap-3 group"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="relative h-10 w-10 rounded-2xl overflow-hidden border border-black/12 shadow-xs bg-white shrink-0">
                  <Image
                    src="/icons/favicon.png"
                    alt="மேதகு களஞ்சியம் லோகோ"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base font-tamil text-[#111111] leading-tight">
                      மேதகு களஞ்சியம்
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0A6847] tracking-wide block uppercase">
                    {isTa ? "நிர்வாகக் குழு" : "Admin Console"}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-tamil">
              {isTa ? "தள மேலாண்மை" : "Platform Management"}
            </div>
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold font-tamil transition-all min-h-[42px] ${
                    active
                      ? "bg-[#0A6847] text-white shadow-sm"
                      : "text-zinc-700 hover:bg-black/5 hover:text-[#0A6847]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${active ? "text-white" : "text-zinc-500"}`} />
                    <span>{isTa ? item.labelTa : item.labelEn}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        active
                          ? "bg-white/20 text-white border-white/30"
                          : item.badgeColor || "bg-black/5 text-zinc-600 border-black/10"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Bottom: Profile & Actions */}
          <div className="p-4 border-t border-black/8 space-y-3 bg-[#FAF9F6]">
            {/* Language & Store Links */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLocale}
                className="flex-1 py-2 px-3 rounded-xl border border-black/10 bg-white text-xs font-bold text-zinc-800 hover:border-[#0A6847] hover:text-[#0A6847] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
              >
                <span className="text-[#0A6847]">A/அ</span>
                <span>{isTa ? "English" : "தமிழ்"}</span>
              </button>
              <Link
                href="/"
                className="py-2 px-3 rounded-xl border border-black/10 bg-white text-xs font-bold text-zinc-800 hover:border-[#0A6847] hover:text-[#0A6847] transition-all flex items-center justify-center gap-1.5 shadow-2xs min-h-[38px]"
                title={isTa ? "பொது தளம்" : "Public Store"}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="font-tamil">{isTa ? "தளம்" : "Store"}</span>
              </Link>
            </div>

            {/* Admin User Card */}
            <div className="p-2.5 rounded-2xl bg-white border border-black/8 shadow-2xs flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-[#0A6847] font-bold flex items-center justify-center shrink-0 border border-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-zinc-900 truncate font-tamil">
                  {isTa ? "களஞ்சிய நிர்வாகி" : "Super Admin"}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>{isTa ? "இணைப்பில் உள்ளார்" : "Live Session"}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Admin Header Bar */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-black/8 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center text-zinc-700 hover:bg-black/5"
                aria-label="பட்டி திற"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 font-tamil leading-tight">
                  {isTa ? "நிர்வாக மேலாண்மை தளம்" : "Admin Management Console"}
                </h1>
                <p className="text-[11px] text-zinc-500 hidden sm:block">
                  UDYAM-TN-18-0101323 • மேதகு களஞ்சியம்
                </p>
              </div>
            </div>

            {/* Quick Actions & Indicators */}
            <div className="flex items-center gap-2">
              <Link
                href="/admin/books"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-xs min-h-[38px] font-tamil"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isTa ? "புதிய நூல்" : "Add Book"}</span>
              </Link>

              <Link
                href="/admin/orders"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-zinc-800 text-xs font-bold transition-all min-h-[38px] font-tamil"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-[#0A6847]" />
                <span>{isTa ? "ஆர்டர்கள்" : "Orders"}</span>
              </Link>

              {/* Public Store Direct Jump */}
              <Link
                href="/"
                className="h-10 px-3 rounded-xl border border-black/10 hover:border-[#0A6847] text-zinc-700 hover:text-[#0A6847] text-xs font-bold flex items-center gap-1.5 transition-colors font-tamil"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden md:inline">{isTa ? "பொது தளம்" : "Store"}</span>
              </Link>
            </div>
          </header>

          {/* Child Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

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
  Film,
  BarChart3,
  Settings,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Plus,
  LogOut,
  Server,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    badge: null,
    badgeColor: "",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingBag,
    badge: "7",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    href: "/admin/books",
    label: "Books Catalog",
    icon: BookOpen,
    badge: "3",
    badgeColor: "bg-rose-100 text-rose-700 border-rose-300",
  },
  {
    href: "/admin/articles",
    label: "Articles & Blog",
    icon: FileText,
    badge: null,
    badgeColor: "",
  },
  {
    href: "/admin/supporters",
    label: "Supporters & Team",
    icon: Users,
    badge: null,
    badgeColor: "",
  },
  {
    href: "/admin/videos",
    label: "Video Archive",
    icon: Film,
    badge: null,
    badgeColor: "",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
    badge: null,
    badgeColor: "",
  },
  {
    href: "/admin/erp",
    label: "ERP Integration",
    icon: Server,
    badge: "Sync",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    href: "/admin/settings",
    label: "Store Settings",
    icon: Settings,
    badge: null,
    badgeColor: "",
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  const getSectionTitle = () => {
    if (pathname === "/admin") return "Overview";
    if (pathname?.startsWith("/admin/orders")) return "Orders";
    if (pathname?.startsWith("/admin/books")) return "Books Catalog";
    if (pathname?.startsWith("/admin/articles")) return "Articles & Blog";
    if (pathname?.startsWith("/admin/supporters")) return "Team & Patrons";
    if (pathname?.startsWith("/admin/analytics")) return "Analytics";
    if (pathname?.startsWith("/admin/erp")) return "ERP Integration";
    if (pathname?.startsWith("/admin/settings")) return "Store Settings";
    return "Admin Console";
  };

  return (
    <div className="min-h-[100dvh] bg-[#F4F5F7] text-[#1A1A1A] flex flex-col font-sans">
      {/* Top Banner */}
      <div className="bg-[#0A6847] text-white px-4 py-2 text-xs font-semibold flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
          </span>
          <span>Admin Console — Methagu Kalanjiyam</span>
        </div>
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1 text-emerald-200 hover:text-white transition-colors"
        >
          <span>View Store</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Brand */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center gap-3"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0 bg-white">
                <Image
                  src="/icons/favicon.png"
                  alt="Methagu Kalanjiyam"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900 leading-tight">
                  Methagu Kalanjiyam
                </div>
                <div className="text-[11px] font-semibold text-[#0A6847] uppercase tracking-wide">
                  Admin Console
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Platform
            </p>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-[#0A6847] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-white" : "text-gray-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        active
                          ? "bg-white/20 text-white border-white/30"
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-gray-400" />
              <span>View Public Store</span>
            </Link>
            <Link
              href="/api/auth/admin/logout"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Link>
            {/* Admin badge */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 mt-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-[#0A6847] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-gray-900 truncate">Super Admin</div>
                <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Live Session
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top header */}
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                    {getSectionTitle()}
                  </h1>
                  <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-400">
                  Admin Console · Methagu Kalanjiyam
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/books"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-semibold transition-all shadow-sm min-h-[38px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Book</span>
              </Link>
              <Link
                href="/admin/orders"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all min-h-[38px]"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Orders</span>
              </Link>
              <Link
                href="/"
                className="h-9 px-3 rounded-xl border border-gray-200 hover:border-[#0A6847] text-gray-600 hover:text-[#0A6847] text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[38px]"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden md:inline">Store</span>
              </Link>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
            {children}
          </main>

          {/* Mobile Sticky Bottom Navigation Bar */}
          <nav
            aria-label="Mobile Admin Navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-lg"
          >
            {[
              { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
              { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "7" },
              { href: "/admin/books", label: "Books", icon: BookOpen },
              { href: "/admin/articles", label: "Articles", icon: FileText },
              { href: "/admin/supporters", label: "Team", icon: Users },
            ].map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[48px] relative cursor-pointer ${
                    active
                      ? "text-[#0A6847] font-bold"
                      : "text-gray-500 hover:text-gray-900 font-medium"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${active ? "text-[#0A6847]" : "text-gray-400"}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] px-1 rounded-full bg-amber-500 text-white text-[8px] font-mono font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 leading-none">{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0.5 h-1 w-5 bg-[#0A6847] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

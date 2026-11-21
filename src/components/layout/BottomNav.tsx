"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Search,
  Newspaper,
  ShoppingBag,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { SearchBar } from "./SearchBar";

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { totalItems } = useCart();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on dedicated admin console routes or book detail view (where sticky purchase bar is active)
  const isBookDetail = Boolean(pathname?.startsWith("/books/") && pathname !== "/books");
  if (pathname?.startsWith("/admin") || isBookDetail) {
    return null;
  }

  const isTa = locale === "ta";
  const cartCount = mounted ? totalItems : 0;

  const isActive = (href: string, exact = false) => {
    if (!pathname) return false;
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const navItems = [
    {
      href: "/",
      labelTa: "முகப்பு",
      labelEn: "Home",
      icon: Home,
      exact: true,
    },
    {
      href: "/books",
      labelTa: "நூல்கள்",
      labelEn: "Books",
      icon: BookOpen,
      exact: false,
    },
    {
      type: "search",
      labelTa: "தேடல்",
      labelEn: "Search",
      icon: Search,
      onClick: () => setSearchOpen(true),
    },
    {
      href: "/blog",
      labelTa: "பதிவுகள்",
      labelEn: "Articles",
      icon: Newspaper,
      exact: false,
    },
    {
      href: "/cart",
      labelTa: "பை",
      labelEn: "Cart",
      icon: ShoppingBag,
      badge: cartCount > 0 ? (cartCount > 99 ? "99+" : cartCount) : null,
      exact: false,
    },
  ];

  return (
    <>
      <nav
        aria-label={isTa ? "முதன்மை கைபேசி வழிசெலுத்தல்" : "Mobile Bottom Navigation"}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 dark:bg-[#121110]/92 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.08] shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-2 pt-1 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))] transition-transform duration-300"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const label = isTa ? item.labelTa : item.labelEn;

            if (item.type === "search") {
              return (
                <button
                  key="bottom-nav-search"
                  type="button"
                  onClick={item.onClick}
                  aria-label={label}
                  className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl min-w-[56px] min-h-[50px] text-gray-500 dark:text-gray-400 hover:text-emerald-700 active:scale-92 transition-all cursor-pointer relative group"
                >
                  <div className="h-9 w-9 rounded-full flex items-center justify-center transition-all group-active:scale-90">
                    <Icon className="h-5 w-5 stroke-[1.8] group-hover:stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-medium mt-0.5 tracking-normal font-tamil leading-none">
                    {label}
                  </span>
                </button>
              );
            }

            const active = isActive(item.href!, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href!}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl min-w-[56px] min-h-[50px] transition-all cursor-pointer relative ${
                  active
                    ? "text-[#0A6847] dark:text-emerald-400 font-bold"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                }`}
              >
                <div
                  className={`relative h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                    active ? "bg-[#0A6847]/10 dark:bg-emerald-400/15 scale-105" : "active:scale-90"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform ${
                      active ? "stroke-[2.2] scale-105" : "stroke-[1.8]"
                    }`}
                  />
                  {item.badge && (
                    <span
                      aria-label={`${item.badge} items in cart`}
                      className="absolute -top-1 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-[#0A6847] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200"
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-normal font-tamil leading-none">
                  {label}
                </span>

                {/* Subtle active pill indicator below icon */}
                {active && (
                  <span className="absolute bottom-0 h-0.5 w-4 bg-[#0A6847] dark:bg-emerald-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Instant Search modal bound to Search tab */}
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

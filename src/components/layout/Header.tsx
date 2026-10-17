"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Search, ShoppingBag, User, Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MobileNav } from "./MobileNav";

interface HeaderProps {
  onOpenSearch?: () => void;
  cartCount?: number;
}

export function Header({ onOpenSearch, cartCount = 0 }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [locale, setLocale] = React.useState<"ta" | "en">("ta");

  const toggleLocale = () => {
    setLocale((prev) => (prev === "ta" ? "en" : "ta"));
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
          <div className="glass-panel rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            
            {/* Logo / Brand */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group transition-transform active:scale-95"
            >
              <div className="h-10 w-10 rounded-xl bg-[#0A6847] flex items-center justify-center text-white shadow-sm shadow-[#0A6847]/30 group-hover:bg-[#085438] transition-colors">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[#111111] leading-tight font-tamil">
                  மெதகு களஞ்சியம்
                </span>
                <span className="text-[10px] tracking-wider uppercase text-[#666666] font-medium">
                  Rare Tamil Literature
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              <Link
                href="/books"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#333333] hover:text-[#0A6847] hover:bg-black/4 transition-colors font-tamil"
              >
                {locale === "ta" ? "நூல்கள்" : "Books"}
              </Link>
              <Link
                href="/blog"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#333333] hover:text-[#0A6847] hover:bg-black/4 transition-colors font-tamil"
              >
                {locale === "ta" ? "பதிவுகள்" : "Articles & News"}
              </Link>
              <Link
                href="/videos"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#333333] hover:text-[#0A6847] hover:bg-black/4 transition-colors font-tamil"
              >
                {locale === "ta" ? "வீடியோக்கள்" : "Videos"}
              </Link>
              <Link
                href="/supporters"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#333333] hover:text-[#0A6847] hover:bg-black/4 transition-colors font-tamil"
              >
                {locale === "ta" ? "ஆதரவாளர்கள்" : "Supporters"}
              </Link>
            </nav>

            {/* Actions: Search, Lang, Cart, Auth */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Search Trigger */}
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Search books"
                className="h-9 px-2.5 sm:px-3 rounded-xl bg-black/5 hover:bg-black/8 text-[#444444] hover:text-[#111111] flex items-center gap-2 text-xs font-medium transition-all active:scale-95 cursor-pointer"
              >
                <Search className="h-4 w-4 text-[#666666]" />
                <span className="hidden sm:inline-block text-[#666666]">
                  {locale === "ta" ? "தேடுக..." : "Search..."}
                </span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] rounded bg-white/70 border border-black/10 text-black/50 shadow-xs">
                  ⌘K
                </kbd>
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLocale}
                className="h-9 px-2.5 rounded-xl border border-black/10 hover:border-black/20 bg-white/50 text-xs font-semibold text-[#333333] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5 text-[#0A6847]" />
                <span>{locale === "ta" ? "தமிழ்" : "EN"}</span>
              </button>

              {/* Shopping Cart */}
              <Link
                href="/cart"
                aria-label="Shopping Cart"
                className="relative h-9 w-9 rounded-xl flex items-center justify-center text-[#222222] hover:text-[#0A6847] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#0A6847] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account / Login */}
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#0A6847]/10 hover:bg-[#0A6847]/18 text-[#0A6847] text-xs font-semibold transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>{locale === "ta" ? "கணக்கு" : "Account"}</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center text-[#333333] hover:bg-black/5 transition-colors"
                aria-label="Open mobile menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        locale={locale}
        onToggleLocale={toggleLocale}
      />
    </>
  );
}

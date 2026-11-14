"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  Sliders,
  ShoppingBag,
} from "lucide-react";
import { BookmarkRibbonIcon } from "@/components/ui/Icons";
import { MobileNav } from "./MobileNav";
import { SearchBar } from "./SearchBar";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
  onOpenSearch?: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const { locale, setLocale, openSettings, wishlist } = useLanguage();
  const { totalItems } = useCart();
  const isTa = locale === "ta";

  // Hide public header on dedicated admin console routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleOpenSearch = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      setSearchModalOpen(true);
    }
  };

  const navLinks = [
    {
      href: "/books",
      labelTa: "நூல்கள்",
      labelEn: "Books",
    },
    {
      href: "/blog",
      labelTa: "பதிவுகள்",
      labelEn: "Articles",
    },
    {
      href: "/videos",
      labelTa: "வீடியோக்கள்",
      labelEn: "Videos",
    },
    {
      href: "/supporters",
      labelTa: "ஆதரவாளர்கள்",
      labelEn: "Supporters",
    },
    {
      href: "/certificate",
      labelTa: "சான்றிதழ்",
      labelEn: "Certificate",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-[var(--z-sticky)] w-full transition-all duration-200">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3">
          <div
            suppressHydrationWarning
            className="rounded-2xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 lg:gap-4 shadow-sm border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]/95 backdrop-blur-xl"
          >
            {/* Logo / Bilingual Brand */}
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 group transition-transform active:scale-98 motion-reduce:active:scale-100 min-h-[44px] shrink-0"
              aria-label={isTa ? "மேதகு களஞ்சியம் — முகப்பு" : "Methagu Kalanjiyam — Home"}
            >
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border border-[var(--color-border-strong)] shadow-2xs bg-white shrink-0 group-hover:scale-105 motion-reduce:group-hover:scale-100 transition-transform">
                <Image
                  src="/icons/favicon.png"
                  alt={isTa ? "மேதகு களஞ்சியம் லோகோ" : "Methagu Kalanjiyam Logo"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col text-left">
                <span
                  className={`font-bold text-sm sm:text-base lg:text-lg tracking-tight text-[var(--color-ink-primary)] leading-tight transition-colors group-hover:text-[var(--color-accent)] whitespace-nowrap ${
                    isTa ? "font-tamil" : "font-sans"
                  }`}
                >
                  {isTa ? "மேதகு களஞ்சியம்" : "Methagu Kalanjiyam"}
                </span>
                <span
                  className={`hidden 2xl:block text-[9px] sm:text-[10px] tracking-wider uppercase text-[var(--color-ink-muted)] font-semibold leading-none mt-0.5 whitespace-nowrap ${
                    isTa ? "font-tamil" : "font-sans"
                  }`}
                >
                  {isTa ? "அரிய தமிழ் ஆவணக் காப்பகம்" : "Rare Tamil Literature & Archives"}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links with Active State */}
            <nav
              className="hidden lg:flex items-center gap-1 xl:gap-1.5"
              aria-label={isTa ? "முதன்மை வழிசெலுத்தல்" : "Main Navigation"}
            >
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors min-h-[38px] flex items-center whitespace-nowrap ${
                      isTa ? "font-tamil" : "font-sans"
                    } ${
                      isActive
                        ? "bg-[var(--color-accent-light)] text-[var(--color-accent)] font-semibold shadow-2xs"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-subtle)]"
                    }`}
                  >
                    <span>{isTa ? link.labelTa : link.labelEn}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Action Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Search Trigger */}
              <button
                type="button"
                onClick={handleOpenSearch}
                aria-label={isTa ? "நூல்களைத் தேடுக (Search books) — ⌘K" : "Search books — ⌘K"}
                className="min-h-[44px] min-w-[44px] h-10 px-2.5 xl:px-3 rounded-xl bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border-hairline)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] flex items-center justify-center gap-2 text-xs font-medium transition-all active:scale-95 motion-reduce:active:scale-100 cursor-pointer"
                title={isTa ? "தேடல் (⌘K)" : "Search (⌘K)"}
              >
                <Search className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                <span className={`hidden xl:inline-block ${isTa ? "font-tamil" : "font-sans"}`}>
                  {isTa ? "தேடுக..." : "Search..."}
                </span>
                <kbd className="hidden 2xl:inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--color-ink-muted)]">
                  ⌘K
                </kbd>
              </button>

              {/* Segmented Language Switcher (Visible on sm+) */}
              <div
                role="group"
                aria-label={isTa ? "மொழித் தேர்வு" : "Language Selector"}
                className="hidden sm:flex h-10 p-1 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-hairline)] items-center gap-0.5 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setLocale("ta")}
                  aria-pressed={isTa}
                  aria-label="தமிழுக்கு மாற்றுக"
                  className={`min-h-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center font-tamil cursor-pointer ${
                    isTa
                      ? "bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-2xs"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)]"
                  }`}
                >
                  <span>தமிழ்</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  aria-pressed={!isTa}
                  aria-label="Switch to English"
                  className={`min-h-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center font-sans cursor-pointer ${
                    !isTa
                      ? "bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-2xs"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)]"
                  }`}
                >
                  <span>EN</span>
                </button>
              </div>

              {/* Reading Settings Trigger */}
              <button
                type="button"
                onClick={openSettings}
                aria-label={isTa ? "தள & வாசிப்பு அமைப்புகள்" : "Reading Settings"}
                className="min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border-hairline)] text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] flex items-center justify-center transition-colors cursor-pointer"
                title={isTa ? "அமைப்புகள்" : "Settings"}
              >
                <Sliders className="h-4 w-4" />
              </button>

              {/* Reader Library & Saved Items */}
              <Link
                href="/account"
                aria-label={isTa ? "வாசகர் அரங்கம் & நூலகம்" : "Reader Library"}
                className="relative hidden sm:flex min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border-hairline)] text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] items-center justify-center transition-colors cursor-pointer shrink-0"
                title={isTa ? "வாசகர் அரங்கம்" : "Reader Library"}
              >
                <BookmarkRibbonIcon className="h-4 w-4" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Hero Cart Action Button */}
              <Link
                href="/cart"
                aria-label={
                  isTa
                    ? `கூடை (${totalItems} நூல்கள்)`
                    : `Shopping Cart (${totalItems} items)`
                }
                className="relative min-h-[44px] h-10 px-3 sm:px-3.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white flex items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                title={isTa ? "கூடை" : "Cart"}
              >
                <ShoppingBag className="h-4 w-4 text-white shrink-0" />
                <span className={`hidden sm:inline ${isTa ? "font-tamil" : "font-sans"}`}>
                  {isTa ? "கூடை" : "Cart"}
                </span>
                {totalItems > 0 && (
                  <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-white text-[var(--color-accent)] text-[11px] font-mono font-extrabold flex items-center justify-center shadow-2xs">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Drawer Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border-hairline)] flex items-center justify-center text-[var(--color-ink-primary)] active:scale-95 transition-all cursor-pointer"
                aria-label={isTa ? "வழிசெலுத்தல் பட்டியினை திறக்குக" : "Open Navigation Menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
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
        onToggleLocale={() => setLocale(isTa ? "en" : "ta")}
      />

      {/* Built-in Spotlight Search Modal */}
      <SearchBar
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}

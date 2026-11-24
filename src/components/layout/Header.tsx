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
  Heart,
} from "lucide-react";
import { MobileNav } from "./MobileNav";
import { SearchBar } from "./SearchBar";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenSearch?: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { locale, setLocale, openSettings, wishlist } = useLanguage();
  const { totalItems } = useCart();
  const isTa = locale === "ta";

  // Ensure client-side only dynamic values do not cause SSR hydration mismatch
  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Safe SSR-consistent values
  const isScrolled = mounted && scrolled;
  const cartCount = mounted ? totalItems : 0;
  const wishlistCount = mounted ? wishlist.length : 0;

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
      labelTa: "காணொளிகள்",
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
      <header
        suppressHydrationWarning
        className={`sticky top-0 z-[var(--z-sticky)] w-full transition-all duration-300 ${
          isScrolled ? "py-1.5 sm:py-2" : "py-2.5 sm:py-3.5"
        }`}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div
            suppressHydrationWarning
            className={`rounded-2xl px-2.5 sm:px-5 lg:px-6 flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-6 border transition-all duration-300 ${
              isScrolled
                ? "py-2 bg-[var(--color-surface-card)]/98 backdrop-blur-2xl border-[var(--color-border-subtle)] shadow-md shadow-black/5"
                : "py-2.5 bg-[var(--color-surface-card)]/92 backdrop-blur-xl border-[var(--color-border-subtle)]/80 shadow-xs"
            }`}
          >
            {/* Left: Brand Logo & Editorial Wordmark */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 group transition-transform active:scale-98 motion-reduce:active:scale-100 min-h-[44px] shrink-0"
              aria-label={isTa ? "மேதகு களஞ்சியம் — முகப்பு" : "Methagu Kalanjiyam — Home"}
            >
              <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden border border-[var(--color-border-strong)] ring-2 ring-[var(--color-accent)]/15 shadow-2xs bg-white shrink-0 group-hover:scale-105 motion-reduce:group-hover:scale-100 transition-transform">
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
                  className={`font-bold text-xs xs:text-sm sm:text-base lg:text-lg tracking-tight text-[var(--color-ink-primary)] leading-tight transition-colors group-hover:text-[var(--color-accent)] whitespace-nowrap ${
                    isTa ? "font-tamil font-bold" : "font-sans font-extrabold"
                  }`}
                >
                  {isTa ? "மேதகு களஞ்சியம்" : "Methagu Kalanjiyam"}
                </span>
                <span
                  className={`hidden 2xl:block text-[9px] sm:text-[10px] tracking-wider uppercase text-[var(--color-accent)] font-semibold leading-none mt-0.5 whitespace-nowrap ${
                    isTa ? "font-tamil" : "font-sans"
                  }`}
                >
                  {isTa ? "அரிய தமிழ் ஆவணக் காப்பகம்" : "Rare Tamil Literature & Archives"}
                </span>
              </div>
            </Link>

            {/* Center: Editorial Navigation Links */}
            <nav
              className="hidden xl:flex items-center gap-0.5 2xl:gap-1.5 shrink-0"
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
                    aria-current={isActive ? "page" : undefined}
                    className={`px-2 2xl:px-3 py-1.5 rounded-lg text-xs 2xl:text-sm font-medium transition-all min-h-[38px] flex items-center whitespace-nowrap ${
                      isTa ? "font-tamil" : "font-sans"
                    } ${
                      isActive
                        ? "bg-[var(--color-accent-light)] text-[var(--color-accent)] font-bold shadow-2xs"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <span>{isTa ? link.labelTa : link.labelEn}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Streamlined Action Toolbar (Apple / Stripe Design Hierarchy) */}
            <div className="flex items-center gap-1 sm:gap-1.5 2xl:gap-2 shrink-0">
              {/* 1. Sleek Search Command Trigger */}
              <button
                type="button"
                onClick={handleOpenSearch}
                aria-label={isTa ? "நூல்களைத் தேடுக — ⌘K" : "Search archives — ⌘K"}
                className="min-h-[44px] min-w-[44px] h-10 px-2.5 2xl:px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] hover:border-black/[0.16] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] flex items-center justify-center gap-2 text-xs font-medium transition-all active:scale-95 motion-reduce:active:scale-100 cursor-pointer shadow-2xs"
                title={isTa ? "தேடல் (⌘K)" : "Search (⌘K)"}
              >
                <Search className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                <span className={`hidden 2xl:inline-block ${isTa ? "font-tamil" : "font-sans"}`}>
                  {isTa ? "தேடுக..." : "Search..."}
                </span>
                <kbd className="hidden 2xl:inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--color-ink-muted)] border border-black/5">
                  ⌘K
                </kbd>
              </button>

              {/* 2. Micro-Segmented Language Switcher (Desktop / Tablet) */}
              <div
                role="group"
                aria-label={isTa ? "மொழித் தேர்வு" : "Language Selector"}
                className="hidden sm:flex h-10 p-0.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] items-center gap-0.5 shrink-0 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setLocale("ta")}
                  aria-pressed={isTa}
                  aria-label="தமிழுக்கு மாற்றுக"
                  className={`min-h-[34px] h-[34px] px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center font-tamil cursor-pointer ${
                    isTa
                      ? "bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-2xs ring-1 ring-black/5"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)]"
                  }`}
                >
                  <span className="text-[var(--color-accent)] mr-1">அ</span>
                  <span>தமிழ்</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  aria-pressed={!isTa}
                  aria-label="Switch to English"
                  className={`min-h-[34px] h-[34px] px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center font-sans cursor-pointer ${
                    !isTa
                      ? "bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-2xs ring-1 ring-black/5"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)]"
                  }`}
                >
                  <span>EN</span>
                </button>
              </div>

              {/* 2b. Mobile Instant Language Toggle (Visible on Mobile < 640px) */}
              <button
                type="button"
                onClick={() => setLocale(isTa ? "en" : "ta")}
                aria-label={isTa ? "Switch language to English" : "தமிழுக்கு மாற்றுக"}
                className="sm:hidden min-h-[44px] min-w-[44px] h-10 px-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] text-xs font-bold text-[var(--color-ink-primary)] flex items-center justify-center gap-1 active:scale-95 transition-all shadow-2xs font-tamil cursor-pointer"
              >
                <span className="text-[var(--color-accent)] font-extrabold">{isTa ? "EN" : "அ"}</span>
                <span className="text-[11px] font-semibold">{isTa ? "English" : "தமிழ்"}</span>
              </button>

              {/* 3. Ghost Settings Icon Button (Available in Mobile Drawer on mobile viewports) */}
              <button
                type="button"
                onClick={openSettings}
                aria-label={isTa ? "தள & வாசிப்பு அமைப்புகள்" : "Reading & Display Settings"}
                className="hidden sm:flex min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] items-center justify-center transition-colors cursor-pointer"
                title={isTa ? "வாசிப்பு அமைப்புகள்" : "Reading Settings"}
              >
                <Sliders className="h-4 w-4" />
              </button>

              {/* 4. Ghost Reader Library / Wishlist Heart Icon Button */}
              <Link
                href="/account"
                aria-label={
                  isTa
                    ? `விருப்பப்பட்டியல் (${wishlistCount} நூல்கள்)`
                    : `Wishlist (${wishlistCount} items)`
                }
                className={cn(
                  "relative hidden sm:flex min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl items-center justify-center transition-colors cursor-pointer shrink-0",
                  wishlistCount > 0
                    ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    : "text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                )}
                title={isTa ? "விருப்பப்பட்டியல்" : "Wishlist"}
              >
                <Heart className={cn("h-4.5 w-4.5", wishlistCount > 0 && "fill-rose-600 text-rose-600")} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* 5. Hero Shopping Cart Button (Single Filled Accent CTA - desktop/tablet, bottom bar on mobile) */}
              <Link
                href="/cart"
                aria-label={
                  isTa
                    ? `கூடை (${cartCount} நூல்கள்)`
                    : `Shopping Cart (${cartCount} items)`
                }
                className="relative hidden sm:flex min-h-[44px] h-10 px-3.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm shadow-[var(--color-accent)]/20 cursor-pointer active:scale-95 shrink-0"
                title={isTa ? "கூடை" : "Cart"}
              >
                <ShoppingBag className="h-4 w-4 text-white shrink-0" />
                <span className={`hidden sm:inline ${isTa ? "font-tamil font-bold" : "font-sans font-bold"}`}>
                  {isTa ? "கூடை" : "Cart"}
                </span>
                {cartCount > 0 && (
                  <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-white text-[var(--color-accent)] text-[11px] font-mono font-extrabold flex items-center justify-center shadow-2xs">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* 6. Mobile Drawer Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl text-[var(--color-ink-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
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

      {/* Synchronized Mobile Drawer Navigation */}
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

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  Sliders,
  ShieldCheck,
  MessageCircle,
  Award,
} from "lucide-react";
import { BookmarkRibbonIcon } from "@/components/ui/Icons";
import { MobileNav } from "./MobileNav";
import { SearchBar } from "./SearchBar";
import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
  onOpenSearch?: () => void;
  cartCount?: number;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const { locale, setLocale, openSettings, wishlist } = useLanguage();
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
      <header className="sticky top-0 z-40 w-full transition-all duration-300">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-2.5 sm:pt-3">
          <div
            suppressHydrationWarning
            className="glass-panel rounded-2xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 lg:gap-3 shadow-sm border border-black/8 bg-white/85 backdrop-blur-xl"
          >
            
            {/* Logo / Bilingual Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-2.5 group transition-transform active:scale-98 motion-reduce:active:scale-100 min-h-[40px] shrink-0"
              aria-label={isTa ? "மேதகு களஞ்சியம் — முகப்பு" : "Methagu Kalanjiyam — Home"}
            >
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border border-black/12 shadow-xs bg-white shrink-0 group-hover:scale-105 motion-reduce:group-hover:scale-100 transition-transform">
                <Image
                  src="/icons/icons/favicon.png"
                  alt={isTa ? "மேதகு களஞ்சியம் லோகோ" : "Methagu Kalanjiyam Logo"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-bold text-sm sm:text-base lg:text-lg tracking-tight text-[#111111] leading-tight transition-colors group-hover:text-[#0A6847] whitespace-nowrap ${
                    isTa ? "font-tamil" : "font-sans"
                  }`}
                >
                  {isTa ? "மேதகு களஞ்சியம்" : "Methagu Kalanjiyam"}
                </span>
                <span
                  className={`hidden 2xl:block text-[9px] sm:text-[10px] tracking-wider uppercase text-[#555555] font-semibold leading-none mt-0.5 whitespace-nowrap ${
                    isTa ? "font-tamil" : "font-sans"
                  }`}
                >
                  {isTa ? "அரிய தமிழ் ஆவணக் காப்பகம்" : "Rare Tamil Literature & Archives"}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links with Active State */}
            <nav
              className="hidden md:flex items-center gap-1 xl:gap-1.5 shrink"
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
                    className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-all min-h-[38px] flex items-center whitespace-nowrap ${
                      isTa ? "font-tamil" : "font-sans"
                    } ${
                      isActive
                        ? "bg-[#0A6847]/10 text-[#0A6847] font-bold shadow-2xs"
                        : "text-[#2A2A2A] hover:text-[#0A6847] hover:bg-black/5"
                    }`}
                  >
                    <span>{isTa ? link.labelTa : link.labelEn}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Action Toolbar: Search, Segmented Lang Switcher, Settings, WhatsApp, Account, Admin */}
            <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0">
              
              {/* Search Trigger */}
              <button
                type="button"
                onClick={handleOpenSearch}
                aria-label={isTa ? "நூல்களைத் தேடுக (Search books) — ⌘K" : "Search books — ⌘K"}
                className="min-h-[40px] min-w-[40px] h-10 px-2.5 2xl:px-3 rounded-xl bg-black/5 hover:bg-black/8 text-[#222222] hover:text-[#0A6847] flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 motion-reduce:active:scale-100 cursor-pointer"
                title={isTa ? "தேடல் (⌘K)" : "Search (⌘K)"}
              >
                <Search className="h-4 w-4 text-[#0A6847] shrink-0" />
                <span className={`hidden 2xl:inline-block ${isTa ? "font-tamil" : "font-sans"}`}>
                  {isTa ? "தேடுக..." : "Search..."}
                </span>
                <kbd className="hidden 2xl:inline-block px-1.5 py-0.5 text-[10px] rounded bg-white/80 border border-black/10 text-black/60 shadow-2xs font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Apple-style Segmented Language Switcher */}
              <div
                role="group"
                aria-label={isTa ? "மொழித் தேர்வு (Language Selector)" : "Language Selector"}
                className="h-10 p-1 rounded-xl bg-black/5 border border-black/8 flex items-center gap-0.5 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setLocale("ta")}
                  aria-pressed={isTa}
                  aria-label="தமிழுக்கு மாற்றுக (Switch to Tamil)"
                  className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center font-tamil cursor-pointer ${
                    isTa
                      ? "bg-white text-[#0A6847] shadow-xs ring-1 ring-black/5"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-white/40"
                  }`}
                >
                  <span>தமிழ்</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  aria-pressed={!isTa}
                  aria-label="Switch to English"
                  className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center font-sans cursor-pointer ${
                    !isTa
                      ? "bg-white text-[#0A6847] shadow-xs ring-1 ring-black/5"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-white/40"
                  }`}
                >
                  <span>EN</span>
                </button>
              </div>

              {/* Platform & Reading Settings Modal Trigger */}
              <button
                type="button"
                onClick={openSettings}
                aria-label={isTa ? "தள & வாசிப்பு அமைப்புகள்" : "Reading & Platform Settings"}
                className="min-h-[40px] min-w-[40px] h-10 w-10 rounded-xl border border-black/10 hover:border-[#0A6847]/40 bg-white/70 text-[#222222] hover:text-[#0A6847] flex items-center justify-center transition-all active:scale-95 motion-reduce:active:scale-100 cursor-pointer shadow-2xs"
                title={isTa ? "அமைப்புகள் (Settings)" : "Settings"}
              >
                <Sliders className="h-4 w-4 text-[#0A6847]" />
              </button>

              {/* Direct WhatsApp Quick Order Icon Button */}
              <a
                href={`https://wa.me/916384654946?text=${encodeURIComponent(
                  "வணக்கம் மேதகு களஞ்சியம், நான் புத்தகங்களை வாங்க விரும்புகிறேன்."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  isTa
                    ? "புலனம் (WhatsApp) வழியாக நூல்களை வாங்குக — +91 63846 54946"
                    : "Order via WhatsApp (+91 63846 54946)"
                }
                className="min-h-[40px] min-w-[40px] h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                title={isTa ? "புலனம் (WhatsApp) வழி வாங்குக" : "Order on WhatsApp"}
              >
                <MessageCircle className="h-4 w-4 fill-white" />
              </a>

              {/* Reader Account / Saved Library with Badge */}
              <Link
                href="/account"
                aria-label={isTa ? "வாசகர் கணக்கு & நூலகம்" : "Reader Account & Library"}
                className="hidden sm:flex items-center justify-center gap-1.5 min-h-[40px] h-10 px-2.5 xl:px-3 rounded-xl bg-[#0A6847]/10 hover:bg-[#0A6847]/18 text-[#0A6847] text-xs font-bold transition-all active:scale-[0.98] shrink-0"
                title={isTa ? "வாசகர் கணக்கு" : "Reader Account"}
              >
                <BookmarkRibbonIcon className="h-4 w-4 shrink-0" />
                <span className={`hidden md:inline ${isTa ? "font-tamil" : "font-sans"}`}>
                  {isTa ? "கணக்கு" : "Account"}
                </span>
                {wishlist.length > 0 && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-[#0A6847] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Admin Showcase Portal Trigger */}
              <Link
                href="/admin"
                className="hidden sm:flex items-center justify-center gap-1.5 min-h-[40px] h-10 px-2.5 xl:px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-bold transition-all active:scale-[0.98] border border-amber-500/30 shrink-0"
                title={isTa ? "நிர்வாகத் தளம் (மாதிரி காட்சிப்படுத்தல்)" : "Admin Portal (Demo Showcase)"}
              >
                <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
                <span className={`hidden md:inline ${isTa ? "font-tamil" : "font-sans"}`}>
                  {isTa ? "நிர்வாகம்" : "Admin"}
                </span>
              </Link>

              {/* Mobile Drawer Navigation Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden min-h-[40px] min-w-[40px] h-10 w-10 rounded-xl flex items-center justify-center text-[#222222] hover:bg-black/5 active:bg-black/10 transition-colors"
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

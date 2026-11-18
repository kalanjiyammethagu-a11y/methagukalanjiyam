"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  X,
  Home,
  BookOpen,
  Newspaper,
  Award,
  Sliders,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import {
  ArchivalFilmFrameIcon,
  ArchivalWaxSealIcon,
  BookmarkRibbonIcon,
} from "@/components/ui/Icons";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  locale: "ta" | "en";
  onToggleLocale: () => void;
}

export function MobileNav({
  isOpen,
  onClose,
  locale,
}: MobileNavProps) {
  const pathname = usePathname();
  const { openSettings, setLocale, wishlist } = useLanguage();
  const { totalItems } = useCart();
  const isTa = locale === "ta";
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  // Lock body scroll and focus trap on open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }

        if (e.key === "Tab" && drawerRef.current) {
          const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links = [
    {
      href: "/",
      labelTa: "முகப்பு",
      labelEn: "Home",
      subTa: "களஞ்சிய முதன்மைப் பக்கம்",
      subEn: "Main Showcase",
      icon: Home,
    },
    {
      href: "/books",
      labelTa: "நூல்கள்",
      labelEn: "Books Catalog",
      subTa: "அரிய வரலாற்று ஆவணங்கள்",
      subEn: "Full Catalog & Search",
      icon: BookOpen,
    },
    {
      href: "/cart",
      labelTa: "கூடை",
      labelEn: "Shopping Cart",
      subTa: "தேர்ந்தெடுக்கப்பட்ட நூல்கள்",
      subEn: "Selected Publications",
      icon: ShoppingBag,
      badge: totalItems > 0 ? totalItems.toString() : null,
    },
    {
      href: "/blog",
      labelTa: "களஞ்சியப் பதிவுகள்",
      labelEn: "Articles & News",
      subTa: "வரலாற்று ஆய்வுக் கட்டுரைகள்",
      subEn: "Essays & Features",
      icon: Newspaper,
    },
    {
      href: "/videos",
      labelTa: "வீடியோ ஆவணங்கள்",
      labelEn: "Video Archives",
      subTa: "வரலாற்று காட்சிப் பதிவுகள்",
      subEn: "Historical Footage",
      icon: ArchivalFilmFrameIcon,
    },
    {
      href: "/supporters",
      labelTa: "ஆதரவாளர்கள்",
      labelEn: "Our Patrons",
      subTa: "களஞ்சியப் பொறுப்பாளர்கள்",
      subEn: "Team & Contributors",
      icon: ArchivalWaxSealIcon,
    },
    {
      href: "/certificate",
      labelTa: "நிறுவனச் சான்றிதழ்",
      labelEn: "MSME Certificate",
      subTa: "மத்திய அரசு பதிவு எண்",
      subEn: "UDYAM-TN-18-0101323",
      icon: Award,
    },
    {
      href: "/account",
      labelTa: "வாசகர் கணக்கு & நூலகம்",
      labelEn: "My Library & Account",
      subTa: "விருப்பப் பட்டியல் & முகவரி",
      subEn: "Bookmarks & Preferences",
      icon: BookmarkRibbonIcon,
      badge: wishlist.length > 0 ? wishlist.length.toString() : null,
    },
  ];

  return (
    <div
      id="mobile-navigation-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={isTa ? "மொபைல் வழிசெலுத்தல் பட்டி" : "Mobile Navigation Drawer"}
      className="fixed inset-0 z-[var(--z-drawer)] lg:hidden flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-xs h-full bg-[var(--color-surface-card)] border-l border-[var(--color-border-subtle)] p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[var(--color-border-hairline)]">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative h-9 w-9 rounded-full overflow-hidden border border-[var(--color-border-strong)] ring-1 ring-[var(--color-accent)]/20 shadow-2xs bg-white shrink-0">
                <Image
                  src="/icons/favicon.png"
                  alt={isTa ? "மேதகு களஞ்சியம்" : "Methagu Kalanjiyam"}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className={`font-bold text-sm tracking-tight text-[var(--color-ink-primary)] leading-tight ${isTa ? "font-tamil" : "font-sans"}`}>
                  {isTa ? "மேதகு களஞ்சியம்" : "Methagu Kalanjiyam"}
                </span>
                <span className={`text-[9px] tracking-wider uppercase text-[var(--color-accent)] font-semibold leading-none mt-0.5 ${isTa ? "font-tamil" : "font-sans"}`}>
                  {isTa ? "அரிய தமிழ் ஆவணக் காப்பகம்" : "National Archives"}
                </span>
              </div>
            </Link>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl flex items-center justify-center text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-subtle)] active:scale-95 transition-all cursor-pointer"
              aria-label={isTa ? "பட்டியினை மூடுக" : "Close Menu"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Top Segmented Language Switcher Pill */}
          <div className="p-1 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-hairline)] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setLocale("ta")}
              aria-pressed={isTa}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-tamil transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
                isTa
                  ? "bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-2xs ring-1 ring-black/5"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)]"
              }`}
            >
              <span className="text-[var(--color-accent)] font-bold">அ</span>
              <span>தமிழ்</span>
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={!isTa}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
                !isTa
                  ? "bg-[var(--color-surface-card)] text-[var(--color-accent)] shadow-2xs ring-1 ring-black/5"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)]"
              }`}
            >
              <span>English</span>
            </button>
          </div>

          {/* Links List */}
          <nav
            className="flex flex-col gap-1"
            aria-label={isTa ? "மொபைல் வழிசெலுத்தல் இணைப்புகள்" : "Mobile Navigation Links"}
          >
            {links.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all min-h-[44px] ${
                    isActive
                      ? "bg-[var(--color-accent-light)] text-[var(--color-accent)] font-bold shadow-2xs"
                      : "text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-subtle)] active:scale-98"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-surface-subtle)] text-[var(--color-accent)]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div
                        className={`text-xs font-bold truncate leading-tight ${
                          isTa ? "font-tamil" : "font-sans"
                        }`}
                      >
                        {isTa ? item.labelTa : item.labelEn}
                      </div>
                      <div
                        className={`text-[10px] text-[var(--color-ink-muted)] truncate leading-none mt-0.5 ${
                          isTa ? "font-tamil" : "font-sans"
                        }`}
                      >
                        {isTa ? item.subTa : item.subEn}
                      </div>
                    </div>
                  </div>

                  {item.badge ? (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--color-ink-muted)] shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-4 border-t border-[var(--color-border-hairline)] space-y-2 mt-4">
          {/* Settings Trigger Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              openSettings();
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border-hairline)] text-xs font-bold text-[var(--color-ink-primary)] transition-all flex items-center justify-center gap-2 shadow-2xs min-h-[44px] cursor-pointer active:scale-98"
          >
            <Sliders className="h-4 w-4 text-[var(--color-accent)]" />
            <span className={isTa ? "font-tamil" : "font-sans"}>
              {isTa ? "வாசிப்பு & தள அமைப்புகள்" : "Reading & Display Settings"}
            </span>
          </button>

          {/* Direct WhatsApp Ordering Hotline */}
          <a
            href={`https://wa.me/916384654946?text=${encodeURIComponent(
              "வணக்கம் மேதகு களஞ்சியம், நான் புத்தகங்களை வாங்க விரும்புகிறேன்."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs min-h-[44px] cursor-pointer active:scale-98"
          >
            <MessageCircle className="h-4 w-4 fill-white" />
            <span className={isTa ? "font-tamil" : "font-sans"}>
              {isTa ? "புலனம் (WhatsApp) வழி வாங்குக" : "Chat & Order on WhatsApp"}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

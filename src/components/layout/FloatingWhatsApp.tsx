"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

import { cn } from "@/lib/utils";

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // When on a book detail page on mobile, elevate above the sticky purchase bar
  const isBookDetail = Boolean(pathname?.startsWith("/books/") && pathname !== "/books");

  const message = encodeURIComponent(
    "வணக்கம் மேதகு களஞ்சியம், நான் புத்தகங்களை வாங்க விரும்புகிறேன்."
  );

  return (
    <aside
      aria-label={isTa ? "வாட்ஸ்அப் உதவி மையம்" : "WhatsApp Helpdesk"}
      className={cn(
        "fixed right-5 z-40 flex items-center gap-2 group transition-all duration-200",
        isBookDetail ? "bottom-20 sm:bottom-5" : "bottom-5"
      )}
    >
      {/* Tooltip badge on hover/focus */}
      <span className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-white text-emerald-950 font-bold text-xs shadow-lg border border-black/8 opacity-0 group-hover:opacity-100 transition-opacity font-tamil pointer-events-none">
        {isTa ? "நூல்கள் வாங்க வாட்ஸ்அப்பில் பேசுக" : "Order via WhatsApp"}
      </span>

      {/* Floating Action Button */}
      <a
        href={`https://wa.me/916384654946?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={
          isTa
            ? "வாட்ஸ்அப் (WhatsApp) வழியாக நூல்களை வாங்குக — +91 63846 54946"
            : "Chat & Order on WhatsApp (+91 63846 54946)"
        }
        className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-emerald-900/40 border-2 border-white transition-all duration-300 min-h-[48px] min-w-[48px]"
      >
        <MessageCircle className="h-7 w-7 fill-white" />
      </a>
    </aside>
  );
}

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

import { cn } from "@/lib/utils";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const isBookDetail = Boolean(pathname?.startsWith("/books/") && pathname !== "/books");
  const isCart = pathname === "/cart";

  // Hide on admin console routes only
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const message = encodeURIComponent(
    "வணக்கம் மேதகு களஞ்சியம், எனக்கு உதவி தேவைப்படுகிறது."
  );

  return (
    <aside
      aria-label={isTa ? "வெளிநாட்டு ஆர்டர் & உதவி மையம்" : "Customer Support & Overseas Orders"}
      className={cn(
        "fixed right-4 sm:right-5 z-40 flex items-center gap-2 group transition-all duration-200",
        isBookDetail || isCart
          ? "bottom-24 sm:bottom-6"
          : "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6"
      )}
    >
      {/* Tooltip badge on hover/focus */}
      <span className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 text-emerald-950 dark:text-emerald-100 font-bold text-xs shadow-lg border border-black/8 dark:border-white/15 opacity-0 group-hover:opacity-100 transition-opacity font-tamil pointer-events-none">
        {isTa ? "வெளிநாட்டு ஆர்டர் & உதவி மையம்" : "Overseas Orders & Support"}
      </span>

      {/* Floating Action Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={
          isTa
            ? `வெளிநாட்டு ஆர்டர் மற்றும் உதவி மையம் — +${WHATSAPP_NUMBER}`
            : `Overseas Orders & Support via WhatsApp (+${WHATSAPP_NUMBER})`
        }
        className="h-14 w-14 rounded-full bg-[#0A6847] hover:bg-[#085237] active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-emerald-900/40 border-2 border-white dark:border-zinc-800 transition-all duration-300 min-h-[48px] min-w-[48px]"
      >
        <MessageCircle className="h-7 w-7 fill-white" />
      </a>
    </aside>
  );
}

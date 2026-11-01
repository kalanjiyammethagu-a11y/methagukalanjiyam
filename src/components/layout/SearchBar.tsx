"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, CornerDownLeft, ArrowRight } from "lucide-react";
import { allBooks, type BookItem } from "@/data/books";
import { formatINR } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const matchingBooks = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allBooks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.titleEn.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.authorEn.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [query]);

  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => inputRef.current?.focus(), 60);

      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          onClose();
        }
        if (e.key === "Escape") {
          onClose();
        }

        // Focus trap
        if (e.key === "Tab" && modalRef.current) {
          const focusables = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;

          const firstEl = focusables[0];
          const lastEl = focusables[focusables.length - 1];

          if (e.shiftKey && document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      setQuery("");
    }
  }, [isOpen, onClose]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/books?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const quickCategories = [
    { labelTa: "வரலாறு", labelEn: "History", slug: "history" },
    { labelTa: "நினைவுகள்", labelEn: "Memoirs", slug: "memoirs" },
    { labelTa: "ஆவணத் தொகுப்பு", labelEn: "Archives", slug: "archives" },
    { labelTa: "வாழ்க்கை வரலாறு", labelEn: "Biographies", slug: "biographies" },
    { labelTa: "அரசியல்", labelEn: "Political", slug: "political" },
  ];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isTa ? "நூல்கள் தேடல்" : "Search Books"}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Spotlight Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-black/10 shadow-2xl overflow-hidden z-10"
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center px-4 border-b border-black/10">
          <label htmlFor="search-dialog-input" className="sr-only">
            {isTa ? "நூல்களைத் தேடுக (Search books)" : "Search books"}
          </label>
          <Search className="h-5 w-5 text-[#0A6847] shrink-0" aria-hidden="true" />
          <input
            id="search-dialog-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isTa
                ? "நூலின் பெயர், ஆசிரியர், அல்லது Tanglish-இல் தேடுக..."
                : "Search book title, author, or keyword..."
            }
            aria-label={isTa ? "நூலின் பெயர் அல்லது ஆசிரியரைத் தேடுக" : "Search books or author"}
            className={`w-full h-14 px-3 text-base text-[#111111] placeholder:text-[#6E6E6E] bg-transparent focus:outline-none ${
              isTa ? "font-tamil" : "font-sans"
            }`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label={isTa ? "தேடலை அழிக்கவும்" : "Clear search query"}
              className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-[#555555] font-mono px-2">
              <span>ESC</span>
            </div>
          )}
        </form>

        {/* Live Search Results or Quick Categories */}
        {query.trim() ? (
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            <span className={`text-xs font-bold text-[#444444] uppercase tracking-wider block ${isTa ? "font-tamil" : "font-sans"}`}>
              {isTa ? "பொருத்தமான நூல்கள்" : "Matching Books"} ({matchingBooks.length})
            </span>
            {matchingBooks.length > 0 ? (
              <div className="space-y-2">
                {matchingBooks.map((b) => (
                  <Link
                    key={b.id}
                    href={`/books/${b.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#0A6847]/5 border border-transparent hover:border-[#0A6847]/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 aspect-[3/4] rounded-md overflow-hidden bg-black/5 shrink-0 border border-black/10">
                        <Image
                          src={b.image}
                          alt={isTa ? b.title : b.titleEn}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className={`text-xs sm:text-sm font-bold text-[#111111] group-hover:text-[#0A6847] transition-colors line-clamp-1 ${isTa ? "font-tamil" : "font-sans"}`}>
                          {isTa ? b.title : b.titleEn}
                        </h4>
                        <p className={`text-[11px] text-[#666666] ${isTa ? "font-tamil" : "font-sans"}`}>
                          {isTa ? b.author : b.authorEn} •{" "}
                          <span className="font-semibold text-[#0A6847] font-mono">
                            {formatINR(b.price)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#888888] group-hover:text-[#0A6847] group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className={`py-6 text-center text-xs text-[#777777] ${isTa ? "font-tamil" : "font-sans"}`}>
                {isTa
                  ? `“${query}” என்ற பெயரில் எந்த நூலும் பொருந்தவில்லை. முழுப் பட்டியலை காண Enter அழுத்தவும்.`
                  : `No books match “${query}”. Press Enter to browse full catalog.`}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-black/[0.02] space-y-3">
            <span className={`text-xs font-bold text-[#444444] uppercase tracking-wider block ${isTa ? "font-tamil" : "font-sans"}`}>
              {isTa ? "விரைவுப் பிரிவுகள்" : "Quick Categories"}
            </span>
            <div className="flex flex-wrap gap-2">
              {quickCategories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    router.push(`/books?category=${cat.slug}`);
                    onClose();
                  }}
                  className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl bg-white border border-black/10 hover:border-[#0A6847] hover:text-[#0A6847] text-xs font-semibold text-[#222222] transition-all active:scale-95 motion-reduce:active:scale-100 cursor-pointer shadow-2xs ${
                    isTa ? "font-tamil" : "font-sans"
                  }`}
                >
                  {isTa ? cat.labelTa : cat.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Hint */}
        <div className="px-4 py-3 bg-black/[0.03] border-t border-black/8 flex items-center justify-between text-xs text-[#555555]">
          <span className={isTa ? "font-tamil" : "font-sans"}>
            {isTa ? "முழு நூல்களையும் காண Enter அழுத்தவும்" : "Press Enter to see all catalog results"}
          </span>
          <div className="flex items-center gap-1 font-mono">
            <CornerDownLeft className="h-4 w-4" />
            <span>Enter</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen, ArrowRight, CornerDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handle Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/books?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const quickCategories = [
    { label: "வரலாறு", slug: "history" },
    { label: "தலைவர்கள்", slug: "leaders" },
    { label: "ஈழ ஆவணங்கள்", slug: "eelam" },
    { label: "நாவல்கள்", slug: "novels" },
    { label: "கவிதைகள்", slug: "poetry" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Spotlight Modal */}
      <div className="relative w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center px-4 border-b border-black/8">
          <Search className="h-5 w-5 text-[#0A6847] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="நூலின் பெயர், ஆசிரியர், அல்லது Tanglish-இல் தேடுக..."
            className="w-full h-14 px-3 text-base text-[#111111] placeholder:text-black/40 bg-transparent focus:outline-none font-tamil"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[#666666] hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-black/40 font-mono">
              <span>ESC</span>
            </div>
          )}
        </form>

        {/* Quick Filter Categories */}
        <div className="p-4 bg-black/2 space-y-3">
          <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block font-tamil">
            விரைவுப் பிரிவுகள் (Quick Categories)
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
                className="px-3 py-1.5 rounded-xl bg-white border border-black/8 hover:border-[#0A6847] hover:text-[#0A6847] text-xs font-medium text-[#333333] transition-all font-tamil active:scale-95 cursor-pointer shadow-xs"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-black/4 border-t border-black/6 flex items-center justify-between text-[11px] text-[#666666]">
          <span className="font-tamil">முழு நூல்களையும் காண Enter அழுத்தவும்</span>
          <div className="flex items-center gap-1">
            <CornerDownLeft className="h-3.5 w-3.5" />
            <span>Search</span>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  slug: string;
  labelTa: string;
  labelEn: string;
  count?: number;
}

interface CategoryPillsProps {
  categories: CategoryOption[];
  selected: string;
  onSelect: (slug: string) => void;
  locale?: "ta" | "en";
  allLabelTa?: string;
  allLabelEn?: string;
  className?: string;
}

export function CategoryPills({
  categories,
  selected,
  onSelect,
  locale = "ta",
  allLabelTa = "அனைத்தும்",
  allLabelEn = "All",
  className,
}: CategoryPillsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "p-1 rounded-2xl bg-black/[0.04] backdrop-blur-md border border-black/[0.08] flex items-center gap-1 overflow-x-auto scrollbar-none shadow-2xs",
        className
      )}
      role="tablist"
      aria-label={locale === "ta" ? "பிரிவு வடிப்பான்கள்" : "Category filters"}
    >
      {/* "All" pill */}
      <button
        type="button"
        role="tab"
        aria-selected={selected === "all"}
        onClick={() => onSelect("all")}
        className={cn(
          "min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer font-tamil active:scale-[0.98]",
          selected === "all"
            ? "bg-[#0A6847] text-white shadow-xs font-bold"
            : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
        )}
      >
        {locale === "ta" ? allLabelTa : allLabelEn}
      </button>

      {categories.map((cat) => (
        <button
          key={cat.slug}
          type="button"
          role="tab"
          aria-selected={selected === cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={cn(
            "min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer font-tamil active:scale-[0.98]",
            selected === cat.slug
              ? "bg-[#0A6847] text-white shadow-xs font-bold"
              : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
          )}
        >
          {locale === "ta" ? cat.labelTa : cat.labelEn}
          {cat.count !== undefined && (
            <span
              className={cn(
                "ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full font-mono",
                selected === cat.slug ? "bg-white/20 text-white" : "bg-black/8 text-zinc-500"
              )}
            >
              {cat.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

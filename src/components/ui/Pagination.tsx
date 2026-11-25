"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  locale?: "ta" | "en";
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  locale = "ta",
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      aria-label={locale === "ta" ? "பக்க வழிச்செலுத்தல்" : "Page navigation"}
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      {/* Previous */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={locale === "ta" ? "முந்தைய பக்கம்" : "Previous page"}
        className="min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl flex items-center justify-center text-[#333333] dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0A6847] dark:hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="h-10 w-8 flex items-center justify-center text-[#666666] dark:text-zinc-400 text-sm select-none"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            aria-label={`${locale === "ta" ? "பக்கம்" : "Page"} ${page}`}
            className={cn(
              "min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-200 cursor-pointer",
              currentPage === page
                ? "bg-[#0A6847] dark:bg-[#0D5C3A] text-white shadow-sm shadow-[#0A6847]/20"
                : "text-[#333333] dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0A6847] dark:hover:text-emerald-400"
            )}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={locale === "ta" ? "அடுத்த பக்கம்" : "Next page"}
        className="min-h-[44px] min-w-[44px] h-10 w-10 rounded-xl flex items-center justify-center text-[#333333] dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0A6847] dark:hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}

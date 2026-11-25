"use client";

import * as React from "react";
import { BookCard } from "@/components/books/BookCard";
import { useLanguage } from "@/context/LanguageContext";
import type { BookItem } from "@/data/books";

export interface CategoryFilterTabsProps {
  books: BookItem[];
}

const categories = [
  { id: "all", labelTa: "அனைத்தும்", labelEn: "All Books" },
  { id: "history", labelTa: "வரலாறு", labelEn: "History" },
  { id: "memoirs", labelTa: "நினைவுகள்", labelEn: "Memoirs" },
  { id: "archives", labelTa: "ஆவணங்கள்", labelEn: "Archives" },
  { id: "biographies", labelTa: "தலைவர்கள்", labelEn: "Leadership" },
];

export function CategoryFilterTabs({ books }: CategoryFilterTabsProps) {
  const { locale } = useLanguage();
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const filteredBooks = React.useMemo(() => {
    if (selectedCategory === "all") return books;
    return books.filter((book) => book.categorySlug === selectedCategory);
  }, [books, selectedCategory]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-4 border-b border-black/8 dark:border-white/10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-zinc-100 font-tamil-serif leading-snug">
            {locale === "ta" ? "முக்கிய வரலாற்று நூற்பட்டியல்" : "Curated Archival Catalog"}
          </h2>
          <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 font-medium mt-1 font-tamil leading-relaxed">
            {locale === "ta"
              ? "களப் பதிவுகள், வரலாற்று நூல்கள் மற்றும் தலைவர்களின் உரைத் தொகுப்புகள்."
              : "Authenticated monographs, tactical field records, and archival volumes available for order."}
          </p>
        </div>

        {/* Category Filter — Apple HIG Segmented Bar */}
        <div
          className="p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] flex items-center gap-1 overflow-x-auto scrollbar-none shadow-2xs"
          role="tablist"
          aria-label={locale === "ta" ? "நூல் வகை வடிப்பான்கள்" : "Catalog category filters"}
        >
          {categories.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(tab.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer font-tamil leading-[1.45] active:scale-[0.98] ${
                  isActive
                    ? "bg-[#0A6847] dark:bg-[#0D5C3A] text-white shadow-xs font-bold"
                    : "text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                }`}
              >
                {locale === "ta" ? tab.labelTa : tab.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Proportional Archival Book Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
        {filteredBooks.map((book, index) => (
          <BookCard
            key={book.id}
            book={book}
            locale={locale}
            variant={index === 0 && selectedCategory === "all" ? "featured" : "default"}
          />
        ))}
      </div>
    </div>
  );
}

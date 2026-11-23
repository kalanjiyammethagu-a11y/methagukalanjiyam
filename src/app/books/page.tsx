"use client";

import * as React from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Grid3X3, LayoutList, BookOpen } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryPills, type CategoryOption } from "@/components/ui/CategoryPills";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookCard, type BookCardData } from "@/components/books/BookCard";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

import { allBooks } from "@/data/books";


import { useSearchParams } from "next/navigation";

const categoryOptions: CategoryOption[] = [
  { slug: "history", labelTa: "வரலாறு", labelEn: "History" },
  { slug: "archives", labelTa: "ஆவணத் தொகுப்பு", labelEn: "Archives" },
  { slug: "memoirs", labelTa: "நினைவுக் குறிப்பு", labelEn: "Memoirs" },
  { slug: "biographies", labelTa: "வாழ்க்கை வரலாறு", labelEn: "Biographies" },
  { slug: "political", labelTa: "அரசியல்", labelEn: "Political" },
];

type SortOption = "relevance" | "price-low" | "price-high" | "name";

const BOOKS_PER_PAGE = 9;

function BooksCatalogContent() {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "all";
  const urlSort = (searchParams.get("sort") as SortOption) || "relevance";

  const [search, setSearch] = React.useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = React.useState(urlCategory);
  const [sortBy, setSortBy] = React.useState<SortOption>(urlSort);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Sync state if user navigates via search modal or browser back/forward
  React.useEffect(() => {
    if (urlQuery !== search) {
      setSearch(urlQuery);
    }
  }, [urlQuery]);

  React.useEffect(() => {
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [urlCategory]);

  const [liveBooks, setLiveBooks] = React.useState<BookCardData[]>(allBooks);

  React.useEffect(() => {
    let isMounted = true;
    async function loadDynamicCatalog() {
      try {
        const res = await fetch("/api/books?limit=100");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.books && Array.isArray(data.books) && data.books.length > 0) {
            const mapped: BookCardData[] = data.books.map((b: any) => ({
              id: b.id,
              slug: b.slug,
              title: b.title,
              titleEn: b.title_en || b.titleEn || b.title,
              author: b.author,
              authorEn: b.author_en || b.authorEn || b.author,
              price: Number(b.price),
              discountPrice: b.discount_price ? Number(b.discount_price) : (b.discountPrice ? Number(b.discountPrice) : undefined),
              image: b.cover_front || b.cover_url || b.image || "/images/books/book-01.webp",
              categorySlug: b.categories?.slug || b.category_slug || b.categorySlug || "history",
              categoryTa: b.categories?.name_ta || b.category_ta || b.categoryTa || "வரலாறு",
              categoryEn: b.categories?.name_en || b.category_en || b.categoryEn || "History",
              stock: Number(b.stock ?? 10),
              featured: Boolean(b.is_featured || b.featured),
              year: b.publication_year || b.year,
              pages: b.pages,
            }));
            setLiveBooks(mapped);
          }
        }
      } catch {
        // Fallback to static catalog if DB is unreachable
      }
    }
    loadDynamicCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter → Sort → Paginate pipeline
  const processedBooks = React.useMemo(() => {
    let books = [...liveBooks];

    // Search filter (searches both Tamil and English titles/authors)
    if (search.trim()) {
      const q = search.toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.titleEn.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.authorEn.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      books = books.filter((b) => {
        const cat = b.categoryTa.toLowerCase();
        const catEn = b.categoryEn.toLowerCase();
        return (
          b.categorySlug === selectedCategory ||
          cat.includes(selectedCategory) ||
          catEn.toLowerCase().includes(selectedCategory)
        );
      });
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        books.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        books.sort((a, b) => b.price - a.price);
        break;
      case "name":
        books.sort((a, b) =>
          locale === "ta"
            ? a.title.localeCompare(b.title, "ta")
            : a.titleEn.localeCompare(b.titleEn, "en")
        );
        break;
      default:
        break;
    }

    return books;
  }, [search, selectedCategory, sortBy, locale]);

  const totalPages = Math.ceil(processedBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = processedBooks.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  // Reset to page 1 on filter/search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, sortBy]);

  return (
    <div className="min-h-[100dvh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs — Gestalt Continuity */}
        <Breadcrumbs
          locale={locale}
          items={[{ label: "நூல்கள்", labelEn: "Books" }]}
        />

        {/* Page Header */}
        <div className="pb-6 sm:pb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] font-tamil tracking-tight">
            {locale === "ta" ? "நூல்கள் களஞ்சியம்" : "Book Catalog"}
          </h1>
          <p className="text-sm sm:text-base text-[#555555] font-medium font-tamil max-w-2xl">
            {locale === "ta"
              ? "தமிழீழ வரலாற்று ஆவணங்கள், போராட்ட நினைவுகள் மற்றும் அரிய பதிப்பக நூல்கள்."
              : "Historical archives, battlefield chronicles, and rare Tamil publications curated for preservation."}
          </p>
        </div>

        {/* Search + Sort Bar */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#0A6847]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === "ta" ? "நூலின் பெயர் அல்லது ஆசிரியர் பெயர் தேடுக..." : "Search by title or author name..."}
              className="w-full h-12 pl-11 pr-12 rounded-xl bg-white border border-black/10 text-base sm:text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#0A6847] focus:border-transparent transition-shadow font-tamil"
              aria-label={locale === "ta" ? "நூல்களைத் தேடுக" : "Search books"}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] h-10 w-10 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-xs text-[#555555] transition-colors cursor-pointer"
                aria-label={locale === "ta" ? "தேடலை அழி" : "Clear search"}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters Row: Categories + Sort + View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Category Pills — Hick's Law: limited visible choices */}
            <CategoryPills
              categories={categoryOptions}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              locale={locale}
              className="flex-1"
            />

            {/* Sort + View Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="min-h-[44px] sm:min-h-[36px] h-10 sm:h-9 pl-8 pr-8 rounded-xl bg-white border border-black/10 text-base sm:text-xs font-semibold text-[#333333] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6847] transition-shadow"
                  aria-label={locale === "ta" ? "வரிசைப்படுத்து" : "Sort by"}
                >
                  <option value="relevance">{locale === "ta" ? "பொருத்தம்" : "Relevance"}</option>
                  <option value="price-low">{locale === "ta" ? "விலை: குறைவு → அதிகம்" : "Price: Low → High"}</option>
                  <option value="price-high">{locale === "ta" ? "விலை: அதிகம் → குறைவு" : "Price: High → Low"}</option>
                  <option value="name">{locale === "ta" ? "பெயர்" : "Name"}</option>
                </select>
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#0A6847] pointer-events-none" />
              </div>

              {/* View toggle — Apple HIG Segmented Control */}
              <div
                className="p-1 rounded-2xl bg-black/[0.04] backdrop-blur-md border border-black/[0.08] flex items-center gap-1 shadow-2xs"
                role="radiogroup"
                aria-label={locale === "ta" ? "காட்சி முறை" : "View mode"}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label={locale === "ta" ? "கட்டக காட்சி (Grid view)" : "Grid view"}
                  aria-checked={viewMode === "grid"}
                  role="radio"
                  className={cn(
                    "min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] h-10 w-10 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-[0.98]",
                    viewMode === "grid"
                      ? "bg-[#0A6847] text-white shadow-xs font-bold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                  )}
                  title={locale === "ta" ? "கட்டகம்" : "Grid"}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label={locale === "ta" ? "பட்டியல் காட்சி (List view)" : "List view"}
                  aria-checked={viewMode === "list"}
                  role="radio"
                  className={cn(
                    "min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] h-10 w-10 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-[0.98]",
                    viewMode === "list"
                      ? "bg-[#0A6847] text-white shadow-xs font-bold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                  )}
                  title={locale === "ta" ? "பட்டியல்" : "List"}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-[#555555] font-medium font-tamil">
            {locale === "ta"
              ? `${processedBooks.length} நூல்கள் கிடைத்தன`
              : `${processedBooks.length} books found`}
          </p>
        </div>

        {/* Book Grid / List — F-Pattern scanning layout */}
        {paginatedBooks.length > 0 ? (
          <>
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7"
                  : "flex flex-col gap-4"
              )}
            >
              {paginatedBooks.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  locale={locale}
                  variant={
                    viewMode === "list"
                      ? "horizontal"
                      : index === 0 && currentPage === 1 && !search
                      ? "featured"
                      : "default"
                  }
                  onAddToCart={() => {
                    /* Cart integration placeholder */
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="py-10 sm:py-14">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                locale={locale}
              />
            </div>
          </>
        ) : (
          /* Empty State — Zero Dead Ends */
          <EmptyState
            icon={<BookOpen className="h-10 w-10" />}
            titleTa="நூல்கள் எதுவும் கிடைக்கவில்லை"
            titleEn="No books found"
            descriptionTa="உங்கள் தேடல் அல்லது வடிப்பானை மாற்றி முயற்சிக்கவும்."
            descriptionEn="Try adjusting your search or filter to find what you're looking for."
            actionLabelTa="வடிப்பான்களை அழி"
            actionLabelEn="Clear all filters"
            onAction={() => {
              setSearch("");
              setSelectedCategory("all");
              setSortBy("relevance");
            }}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}

export default function BooksPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[100dvh] py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-black/5 rounded-xl" />
            <div className="h-12 w-full bg-black/5 rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-black/5 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <BooksCatalogContent />
    </React.Suspense>
  );
}

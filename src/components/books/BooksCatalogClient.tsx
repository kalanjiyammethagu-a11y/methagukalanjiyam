"use client";

import * as React from "react";
import { Search, ArrowUpDown, Grid3X3, LayoutList, BookOpen } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryPills, type CategoryOption } from "@/components/ui/CategoryPills";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookCard, type BookCardData } from "@/components/books/BookCard";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { allBooks } from "@/data/books";
import { useSearchParams } from "next/navigation";
import { matchesSearchQuery } from "@/lib/search";
import { resolveBookFrontCover } from "@/lib/book-images";
import { resolveBilingualPair } from "@/lib/i18n";

const defaultCategoryOptions: CategoryOption[] = [
  { slug: "history", labelTa: "வரலாறு", labelEn: "History" },
  { slug: "archives", labelTa: "ஆவணத் தொகுப்பு", labelEn: "Archives" },
  { slug: "memoirs", labelTa: "நினைவுக் குறிப்பு", labelEn: "Memoirs" },
  { slug: "biographies", labelTa: "வாழ்க்கை வரலாறு", labelEn: "Biographies" },
  { slug: "political", labelTa: "அரசியல்", labelEn: "Political" },
];

type SortOption = "relevance" | "price-low" | "price-high" | "name";

const BOOKS_PER_PAGE = 9;

export function BooksCatalogClient({
  initialBooks,
  initialCategories,
}: {
  initialBooks?: BookCardData[];
  initialCategories?: CategoryOption[];
} = {}) {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "all";
  const urlSort = (searchParams.get("sort") as SortOption) || "relevance";

  const [search, setSearch] = React.useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = React.useState(urlCategory);
  const [sortBy, setSortBy] = React.useState<SortOption>(urlSort);
  const [bestSellersOnly, setBestSellersOnly] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [categoryOptions, setCategoryOptions] = React.useState<CategoryOption[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : defaultCategoryOptions
  );

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

  const [liveBooks, setLiveBooks] = React.useState<BookCardData[]>(
    initialBooks && initialBooks.length > 0 ? initialBooks : allBooks
  );

  React.useEffect(() => {
    const hasInitialBooks = Boolean(initialBooks && initialBooks.length > 0);
    const hasInitialCategories = Boolean(initialCategories && initialCategories.length > 0);
    if (hasInitialBooks && hasInitialCategories) {
      return;
    }

    let isMounted = true;
    async function loadDynamicCatalog() {
      try {
        const [res, catRes] = await Promise.all([
          hasInitialBooks ? Promise.resolve(null) : fetch("/api/books?limit=100"),
          hasInitialCategories ? Promise.resolve(null) : fetch("/api/categories"),
        ]);
        if (catRes && catRes.ok) {
          const catData = await catRes.json().catch(() => ({}));
          if (isMounted && Array.isArray(catData.categories) && catData.categories.length > 0) {
            setCategoryOptions(
              catData.categories.map((c: any) => ({
                slug: c.slug,
                labelTa: c.name_ta || c.name_en,
                labelEn: c.name_en || c.name_ta,
              }))
            );
          }
        }
        if (res && res.ok) {
          const data = await res.json();
          if (isMounted && data.books && Array.isArray(data.books) && data.books.length > 0) {
            const mapped: BookCardData[] = data.books.map((b: any) => {
              const staticMatch = allBooks.find((sb) => sb.slug === b.slug);
              const cover = resolveBookFrontCover(b, staticMatch?.image);
              const titlePair = resolveBilingualPair({
                en: b.title_en || b.titleEn || staticMatch?.titleEn,
                ta: b.title_ta || b.titleTa,
                legacy: b.title,
              });
              const authorPair = resolveBilingualPair({
                en: b.author_en || b.authorEn || staticMatch?.authorEn,
                ta: b.author_ta || b.authorTa,
                legacy: b.author,
              });
              return {
                id: b.id,
                slug: b.slug,
                title: titlePair.ta || b.title || titlePair.en || staticMatch?.title || "",
                titleTa: titlePair.ta || staticMatch?.title || "",
                titleEn: titlePair.en || b.title_en || b.titleEn || staticMatch?.titleEn || titlePair.ta || b.title || "",
                author: authorPair.ta || b.author || authorPair.en || staticMatch?.author || "",
                authorTa: authorPair.ta || staticMatch?.author || "",
                authorEn: authorPair.en || b.author_en || b.authorEn || staticMatch?.authorEn || authorPair.ta || b.author || "",
                price: Number(b.price),
                discountPrice: b.discount_price ? Number(b.discount_price) : (b.discountPrice ? Number(b.discountPrice) : undefined),
                image: cover.url,
                coverIsFront: cover.isFront,
                coverAltEn: b.cover_alt_en || b.coverAltEn || staticMatch?.coverAltEn,
                coverAltTa: b.cover_alt_ta || b.coverAltTa || staticMatch?.coverAltTa,
                categorySlug: b.categories?.slug || b.category_slug || b.categorySlug || "history",
                categoryTa: b.categories?.name_ta || b.category_ta || b.categoryTa || "வரலாறு",
                categoryEn: b.categories?.name_en || b.category_en || b.categoryEn || "History",
                stock: Number(b.stock ?? 10),
                featured: Boolean(b.is_featured || b.featured),
                year: b.published_year || b.publication_year || b.year,
                pages: b.pages,
              };
            });
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

    // Search filter (searches both Tamil and English titles/authors + phonetic Tanglish matching)
    if (search.trim()) {
      books = books.filter((b) =>
        matchesSearchQuery(search, [
          b.title,
          b.titleEn,
          b.author,
          b.authorEn,
          b.categoryTa,
          b.categoryEn,
        ])
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
          catEn.includes(selectedCategory)
        );
      });
    }

    if (bestSellersOnly) {
      books = books.filter((b) => Boolean(b.featured));
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        books.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
        break;
      case "price-high":
        books.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
        break;
      case "name":
        books.sort((a, b) => a.title.localeCompare(b.title, "ta"));
        break;
      case "relevance":
      default:
        // Featured books first, then preservation order
        books.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return books;
  }, [liveBooks, search, selectedCategory, bestSellersOnly, sortBy]);

  // Reset page when filter/search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, bestSellersOnly, sortBy]);

  const totalPages = Math.ceil(processedBooks.length / BOOKS_PER_PAGE);
  const pagedBooks = processedBooks.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  return (
    <div className="min-h-[100dvh] pb-24 sm:pb-16 pt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Breadcrumbs */}
        <Breadcrumbs
          locale={locale}
          items={[
            { label: "நூல்கள்", labelEn: "Books", href: "/books" },
            ...(selectedCategory !== "all"
              ? [
                {
                  label:
                    categoryOptions.find((c) => c.slug === selectedCategory)?.labelTa ||
                    selectedCategory,
                  labelEn:
                    categoryOptions.find((c) => c.slug === selectedCategory)?.labelEn ||
                    selectedCategory,
                },
              ]
              : []),
          ]}
        />

        {/* Hero Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0A6847] dark:bg-emerald-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#0A6847] dark:text-emerald-400 font-tamil">
              {locale === "ta" ? "அனைத்து வெளியீடுகள்" : "All Publications"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-tamil text-[#111111] dark:text-zinc-100 tracking-tight">
                {locale === "ta" ? "நூல்கள் களஞ்சியம்" : "Book Catalog"}
              </h1>
              <p className="text-sm text-[#555555] dark:text-zinc-300 font-tamil mt-1.5 max-w-2xl">
                {locale === "ta"
                  ? "அரிய வரலாற்று ஆவணங்கள், விடுதலைப் போராட்ட நூல்கள் மற்றும் கள ஆய்வுகளின் தொகுப்பு."
                  : "Preserved historical records, memoirs, and national literature from our archival collection."}
              </p>
            </div>

            {/* Results count pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/10 text-[#555555] dark:text-zinc-300 self-start sm:self-auto font-tamil">
              <BookOpen className="h-3.5 w-3.5" />
              <span>
                {locale === "ta"
                  ? `${processedBooks.length} நூல்கள்`
                  : `${processedBooks.length} titles`}
              </span>
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  locale === "ta"
                    ? "நூல் தலைப்பு, ஆசிரியர் பெயர் தேடுக..."
                    : "Search by title or author..."
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white/80 dark:bg-zinc-900/90 text-base sm:text-sm font-tamil text-[#111111] dark:text-zinc-100 placeholder:text-[#555555] dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/40 focus:border-[#0A6847] transition-all min-h-[44px]"
              />
            </div>

            {/* Sort & Best Sellers Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={bestSellersOnly}
                onClick={() => setBestSellersOnly((prev) => !prev)}
                className={cn(
                  "px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] cursor-pointer flex items-center gap-1.5 font-tamil shrink-0",
                  bestSellersOnly
                    ? "bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300 shadow-2xs"
                    : "bg-white/80 dark:bg-zinc-900 border-black/12 dark:border-white/15 text-[#333333] dark:text-zinc-200 hover:border-amber-300"
                )}
              >
                <span aria-hidden="true">★</span>
                <span>{locale === "ta" ? "அதிகம் விற்பனை" : "Best Sellers"}</span>
              </button>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555555] dark:text-zinc-400 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="pl-8 pr-8 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white/80 dark:bg-zinc-900 text-xs font-semibold text-[#111111] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/40 font-tamil appearance-none cursor-pointer min-h-[44px]"
                >
                  <option value="relevance">
                    {locale === "ta" ? "முன்னுரிமை (Relevance)" : "Relevance"}
                  </option>
                  <option value="price-low">
                    {locale === "ta" ? "விலை: குறைவு முதல்" : "Price: Low to High"}
                  </option>
                  <option value="price-high">
                    {locale === "ta" ? "விலை: அதிகம் முதல்" : "Price: High to Low"}
                  </option>
                  <option value="name">
                    {locale === "ta" ? "அகரவரிசை (A-Z)" : "Alphabetical"}
                  </option>
                </select>
              </div>

              {/* View Mode Toggle (Grid / List) */}
              <div className="hidden sm:flex items-center border border-black/12 dark:border-white/15 rounded-xl p-0.5 bg-white/80 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={cn(
                    "p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer",
                    viewMode === "grid"
                      ? "bg-[#0A6847] dark:bg-[#0D5C3A] text-white shadow-xs"
                      : "text-[#555555] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={cn(
                    "p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer",
                    viewMode === "list"
                      ? "bg-[#0A6847] dark:bg-[#0D5C3A] text-white shadow-xs"
                      : "text-[#555555] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white"
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <CategoryPills
            categories={categoryOptions}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            locale={locale}
          />
        </div>

        {/* Books Grid / List */}
        {pagedBooks.length > 0 ? (
          <div className="space-y-10">
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
                  : "space-y-4"
              )}
            >
              {pagedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  locale={locale}
                  variant={viewMode === "list" ? "horizontal" : "default"}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                locale={locale}
              />
            )}
          </div>
        ) : (
          /* Empty State */
          <EmptyState
            icon={<BookOpen className="h-10 w-10 text-[#0A6847] dark:text-emerald-400" />}
            titleTa="நூல்கள் எதுவும் கிடைக்கவில்லை"
            titleEn="No Books Found"
            descriptionTa="நீங்கள் தேடிய சொல் அல்லது பிரிவில் நூல்கள் காணப்படவில்லை. மாற்று சொல்லைத் தட்டச்சு செய்யவும்."
            descriptionEn="Try adjusting your search or filter to find what you're looking for."
            actionLabelTa="வடிப்பான்களை அழி"
            actionLabelEn="Clear all filters"
            onAction={() => {
              setSearch("");
              setSelectedCategory("all");
              setBestSellersOnly(false);
              setSortBy("relevance");
            }}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}

import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BookCard } from "@/components/books/BookCard";
import { BookCoverGallery } from "@/components/books/BookCoverGallery";
import { BookDetailClient } from "@/components/books/BookDetailClient";
import { allBooks, getBookBySlug, getRelatedBooks, type BookItem } from "@/data/books";
import { safeJsonLdStringify } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeGalleryImages,
  resolveBookFrontCover,
  toAbsoluteSiteImageUrl,
} from "@/lib/book-images";

export const revalidate = 60;

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

async function resolveBook(slug: string): Promise<BookItem | undefined> {
  const staticBook = getBookBySlug(slug);
  try {
    const supabase = await createClient();
    const { data: dbBook } = await (supabase.from("books") as any)
      .select("*, categories(name_ta, name_en, slug)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (dbBook) {
      const cover = resolveBookFrontCover(dbBook, staticBook?.image);
      const galleryImages = normalizeGalleryImages(
        dbBook.gallery_images,
        dbBook.cover_back,
        cover.url
      );

      return {
        id: dbBook.id,
        slug: dbBook.slug,
        title: dbBook.title,
        titleEn: dbBook.title_en || staticBook?.titleEn || dbBook.title,
        author: dbBook.author,
        authorEn: dbBook.author_en || staticBook?.authorEn || dbBook.author,
        price: Number(dbBook.price),
        discountPrice: dbBook.discount_price ? Number(dbBook.discount_price) : undefined,
        categorySlug: dbBook.categories?.slug || staticBook?.categorySlug || "history",
        categoryTa: dbBook.categories?.name_ta || staticBook?.categoryTa || "வரலாறு",
        categoryEn: dbBook.categories?.name_en || staticBook?.categoryEn || "History",
        image: cover.url,
        coverIsFront: cover.isFront,
        coverAltEn: dbBook.cover_alt_en || staticBook?.coverAltEn,
        coverAltTa: dbBook.cover_alt_ta || staticBook?.coverAltTa,
        galleryImages: galleryImages.length > 0 ? galleryImages : staticBook?.galleryImages,
        featured: Boolean(dbBook.is_featured),
        stock: Number(dbBook.stock ?? 10),
        pages: dbBook.pages || staticBook?.pages,
        year: String(dbBook.published_year || dbBook.publication_year || staticBook?.year || "2024"),
        publisher: dbBook.publisher || staticBook?.publisher,
        isbn: dbBook.isbn || staticBook?.isbn,
        descriptionTa: dbBook.description_ta || dbBook.description || staticBook?.descriptionTa || "",
        descriptionEn: dbBook.description_en || staticBook?.descriptionEn || dbBook.description || "",
      };
    }
  } catch {
    // Return static if DB is unreachable
  }
  return staticBook;
}

export function generateStaticParams() {
  return allBooks.map((book) => ({
    slug: book.slug,
  }));
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await resolveBook(slug);

  if (!book) {
    return {
      title: "நூல் காணப்படவில்லை | Book Not Found — மேதகு களஞ்சியம்",
      description: "கோரப்பட்ட வரலாற்று நூல் களஞ்சியத்தில் காணப்படவில்லை.",
    };
  }

  const title = `${book.title} (${book.titleEn}) — மேதகு களஞ்சியம்`;
  const description = `${book.descriptionTa.slice(0, 160)}...`;
  const ogImageUrl = toAbsoluteSiteImageUrl(book.image);

  return {
    title,
    description,
    alternates: {
      canonical: `https://methagukalanjiyam.in/books/${book.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://methagukalanjiyam.in/books/${book.slug}`,
      siteName: "மேதகு களஞ்சியம்",
      locale: "ta_IN",
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 1067,
          alt: book.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function BookDetailPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await resolveBook(slug);

  if (!book) {
    notFound();
  }

  const relatedBooks = getRelatedBooks(book);
  const isSoldOut = book.stock <= 0;

  const primaryImageUrl = toAbsoluteSiteImageUrl(book.image);
  const galleryAbsoluteUrls = (book.galleryImages || [])
    .map((g) => toAbsoluteSiteImageUrl(g.url))
    .filter((u) => u !== primaryImageUrl);

  // Structured Data Schema for Book (SEO)
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    alternateName: book.titleEn,
    author: {
      "@type": "Person",
      name: book.author,
      alternateName: book.authorEn,
    },
    publisher: {
      "@type": "Organization",
      name: book.publisher || "மேதகு களஞ்சியம்",
      alternateName: "Methagu Kalanjiyam",
    },
    datePublished: book.year || "2024",
    numberOfPages: book.pages,
    inLanguage: "ta",
    image:
      galleryAbsoluteUrls.length > 0
        ? [primaryImageUrl, ...galleryAbsoluteUrls]
        : primaryImageUrl,
    offers: {
      "@type": "Offer",
      price: book.discountPrice ?? book.price,
      priceCurrency: "INR",
      availability: isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "BookStore",
        name: "மேதகு களஞ்சியம்",
      },
    },
  };

  return (
    <div className="min-h-screen pb-24 sm:pb-16">
      {/* Book Schema.org Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(bookSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          locale="ta"
          items={[
            { label: "நூல்கள்", labelEn: "Books", href: "/books" },
            { label: book.title, labelEn: book.titleEn },
          ]}
        />

        {/* ============================================================
            PRODUCT HERO — Z-Pattern Layout
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 sm:pb-16">
          {/* Left: Book Cover Gallery (Outside Front Cover first) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <GlassPanel className="p-6 sm:p-8 rounded-3xl">
                <BookCoverGallery book={book} />
              </GlassPanel>
            </div>
          </div>

          {/* Right: Product Details & Client Interactive Purchase Unit */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Author Hierarchy */}
            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] dark:text-zinc-100 font-tamil-serif leading-[1.3] text-balance">
                {book.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#666666] dark:text-zinc-400 font-medium tracking-wide" lang="en">
                {book.titleEn}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Badge variant="category" className="text-xs">
                  {book.categoryTa}
                </Badge>
                <span className="text-xs text-black/20 dark:text-white/20" aria-hidden="true">
                  •
                </span>
                <p className="text-sm sm:text-base text-[#0A6847] dark:text-emerald-400 font-bold font-tamil">
                  ஆசிரியர்: {book.author}
                </p>
              </div>
            </div>

            {/* Interactive Price, Quantity, WhatsApp Order, Tabs & Sticky Mobile Bar */}
            <BookDetailClient book={book} />
          </div>
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="py-12 sm:py-16 border-t border-black/8 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                தொடர்புடைய வரலாற்று நூல்கள் (Related Historical Titles)
              </h2>
              <Link
                href="/books"
                className="text-xs sm:text-sm font-bold text-[#0A6847] dark:text-emerald-400 hover:underline font-tamil min-h-[44px] flex items-center"
              >
                அனைத்தையும் காண்க (View All)
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedBooks.map((related) => (
                <BookCard
                  key={related.id}
                  book={related}
                  locale="ta"
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

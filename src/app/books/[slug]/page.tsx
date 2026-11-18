import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BookCard } from "@/components/books/BookCard";
import { BookDetailClient, BookCoverActions } from "@/components/books/BookDetailClient";
import { allBooks, getBookBySlug, getRelatedBooks } from "@/data/books";
import { safeJsonLdStringify } from "@/lib/sanitize";

interface BookPageProps {
  params: Promise<{ slug: string }>;
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
  const book = getBookBySlug(slug);

  if (!book) {
    return {
      title: "நூல் காணப்படவில்லை | Book Not Found — மேதகு களஞ்சியம்",
      description: "கோரப்பட்ட வரலாற்று நூல் களஞ்சியத்தில் காணப்படவில்லை.",
    };
  }

  const title = `${book.title} (${book.titleEn}) — மேதகு களஞ்சியம்`;
  const description = `${book.descriptionTa.slice(0, 160)}...`;
  const ogImageUrl = book.image.startsWith("http")
    ? book.image
    : `https://methagukalanjiyam.in${book.image}`;

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
  const book = getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const relatedBooks = getRelatedBooks(book);
  const isSoldOut = book.stock <= 0;

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
    image: `https://methagukalanjiyam.in${book.image}`,
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
          {/* Left: Book Cover Gallery */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <GlassPanel className="p-6 sm:p-8 rounded-3xl">
                <div className="relative flex items-center justify-center">
                  <div className="relative w-56 sm:w-64 lg:w-72 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl bg-[#ECE8DF]">
                    {/* Spine shadow for 3D tactile feel */}
                    <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/30 via-black/5 to-transparent z-10 pointer-events-none" />
                    {/* Top light reflection */}
                    <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/20 to-transparent z-10 pointer-events-none" />
                    <Image
                      src={book.image}
                      alt={`${book.title} — ${book.titleEn}`}
                      fill
                      sizes="(max-width: 1024px) 280px, 320px"
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Wishlist & Share action buttons below cover */}
                <BookCoverActions book={book} />
              </GlassPanel>
            </div>
          </div>

          {/* Right: Product Details & Client Interactive Purchase Unit */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Author Hierarchy */}
            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] font-tamil-serif leading-[1.3] text-balance">
                {book.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#666666] font-medium tracking-wide" lang="en">
                {book.titleEn}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Badge variant="category" className="text-xs">
                  {book.categoryTa}
                </Badge>
                <span className="text-xs text-black/20" aria-hidden="true">
                  •
                </span>
                <p className="text-sm sm:text-base text-[#0A6847] font-bold font-tamil">
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
          <section className="py-12 sm:py-16 border-t border-black/8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111111] font-tamil">
                தொடர்புடைய வரலாற்று நூல்கள் (Related Historical Titles)
              </h2>
              <Link
                href="/books"
                className="text-xs sm:text-sm font-bold text-[#0A6847] hover:underline font-tamil min-h-[44px] flex items-center"
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

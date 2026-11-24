import * as React from "react";
import type { Metadata } from "next";
import { BooksCatalogClient } from "@/components/books/BooksCatalogClient";
import { safeJsonLdStringify } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import { allBooks } from "@/data/books";
import type { BookCardData } from "@/components/books/BookCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "நூல்கள் களஞ்சியம் — Rare Tamil Literature & Historical Catalog | மேதகு களஞ்சியம்",
  description:
    "அரிய தமிழீழ வரலாற்று ஆவண நூல்கள், போராட்ட நினைவுக் குறிப்புகள், கள ஆய்வுகள் மற்றும் தேசிய ஆவணப் பெட்டகம். நூல்களை பாதுகாப்பாக ஆர்டர் செய்யுங்கள்.",
  alternates: {
    canonical: "https://methagukalanjiyam.in/books",
  },
  openGraph: {
    title: "நூல்கள் களஞ்சியம் — Rare Tamil Literature & Historical Catalog",
    description:
      "அரிய தமிழீழ வரலாற்று ஆவண நூல்கள், போராட்ட நினைவுக் குறிப்புகள் மற்றும் வரலாற்று ஆய்வுகள்.",
    url: "https://methagukalanjiyam.in/books",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/banner-1200.webp",
        width: 1200,
        height: 675,
        alt: "மேதகு களஞ்சியம் நூல் பட்டியல்",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "நூல்கள் களஞ்சியம் — Rare Tamil Literature Catalog",
    description: "அரிய தமிழீழ வரலாற்று ஆவண நூல்கள் மற்றும் தேசிய இலக்கியப் பெட்டகம்.",
    images: ["/images/brand/banner-1200.webp"],
  },
};

export default async function BooksPage() {
  let initialBooks: BookCardData[] = allBooks;

  try {
    const supabase = await createClient();
    const { data: dbBooks } = await (supabase.from("books") as any)
      .select("*, categories(name_ta, name_en, slug)")
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (dbBooks && dbBooks.length > 0) {
      initialBooks = dbBooks.map((b: any) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        titleEn: b.title_en || b.title,
        author: b.author,
        authorEn: b.author_en || b.author,
        price: Number(b.price),
        discountPrice: b.discount_price ? Number(b.discount_price) : null,
        stock: Number(b.stock ?? 10),
        categorySlug: b.categories?.slug || "history",
        categoryTa: b.categories?.name_ta || "வரலாறு",
        categoryEn: b.categories?.name_en || "History",
        image: b.cover_image_url || b.cover_front || "/images/books/book-placeholder.webp",
        featured: Boolean(b.is_featured),
        pages: b.pages,
        year: String(b.published_year || "2024"),
        publisher: b.publisher || "மேதகு களஞ்சியம்",
        descriptionTa: b.description || "",
        descriptionEn: b.description || "",
      }));
    }
  } catch {
    // Keep fallback static catalog
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://methagukalanjiyam.in/books#collection",
        name: "நூல்கள் களஞ்சியம் — Book Catalog",
        url: "https://methagukalanjiyam.in/books",
        description: "Rare Tamil Literature & Historical National Archives Bookstore Catalog.",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://methagukalanjiyam.in/#website",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://methagukalanjiyam.in/books#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "முகப்பு",
            item: "https://methagukalanjiyam.in",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "நூல்கள்",
            item: "https://methagukalanjiyam.in/books",
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
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
        <BooksCatalogClient initialBooks={initialBooks} />
      </React.Suspense>
    </>
  );
}

import * as React from "react";
import type { Metadata } from "next";
import { HeroSlider } from "@/components/home/HeroSlider";
import {
  HomeBentoAndAnnouncements,
  HomeQuoteBanner,
  HomeTaxonomySection,
} from "@/components/home/HomeSectionsClient";
import {
  buildDynamicHeroSlides,
  defaultHeroSlides,
  type BlogPostSlideSource,
} from "@/data/hero-slides";
import { CategoryFilterTabs } from "@/components/home/CategoryFilterTabs";
import { allBooks, type BookItem } from "@/data/books";
import { createClient } from "@/lib/supabase/server";
import { mapDbBookToBookItem } from "@/lib/book-mappers";
import {
  DEFAULT_ANNOUNCEMENTS,
  fetchActiveAnnouncements,
  type AnnouncementItem,
} from "@/lib/announcements";

export const metadata: Metadata = {
  title: "மேதகு களஞ்சியம் — Rare Tamil Literature & National Archives",
  description:
    "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம். அரிய வரலாற்று நூல்களை பாதுகாப்பாக ஆர்டர் செய்யுங்கள்.",
  alternates: {
    canonical: "https://methagukalanjiyam.in",
  },
  openGraph: {
    title: "மேதகு களஞ்சியம் — Rare Tamil Literature & National Archives",
    description:
      "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம்.",
    url: "https://methagukalanjiyam.in",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/banner-1200.webp",
        width: 1200,
        height: 675,
        alt: "மேதகு களஞ்சியம் பதாகை",
      },
    ],
  },
};

const defaultHomeCategories = [
  {
    nameTa: "வரலாறு & ஆவணங்கள்",
    nameEn: "Historical Records & Treatises",
    slug: "history",
    countTa: "19 நூல்கள்",
    countEn: "19 Publications",
    descTa: "சரிபார்க்கப்பட்ட கள ஆய்வுகள், போர் வரலாற்று ஏடுகள் மற்றும் மூல ஆவணப் பதிவுகள்.",
    descEn: "Verified field investigations, strategic treatises, and original archival documentation.",
  },
  {
    nameTa: "போராட்ட நினைவுகள்",
    nameEn: "Memoirs & Battlefield Chronicles",
    slug: "memoirs",
    countTa: "15 நூல்கள்",
    countEn: "15 Publications",
    descTa: "களத்தில் நின்ற போராளிகள் மற்றும் மக்களின் நேரடி நினைவுக் குறிப்புகளின் பெட்டகம்.",
    descEn: "Firsthand accounts, personal diaries, and frontline memoirs from historical participants.",
  },
  {
    nameTa: "ஆவணத் தொகுப்புகள்",
    nameEn: "Archival Compilations",
    slug: "archives",
    countTa: "12 நூல்கள்",
    countEn: "12 Publications",
    descTa: "சாந்தி நேசக்கரம் உள்ளிட்ட அரிய பதிப்பகங்களின் உத்தியோகபூர்வ ஆவண நூல்கள்.",
    descEn: "Authorized compilations and rare publications produced by Saanthi Nesakaram and publishers.",
  },
  {
    nameTa: "தலைவர்கள் வரலாறு",
    nameEn: "Biographies & Leadership",
    slug: "biographies",
    countTa: "8 நூல்கள்",
    countEn: "8 Publications",
    descTa: "தேசியத் தலைவர் மற்றும் தளபதிகளின் சிந்தனைகள், கொள்கை உரைகள் மற்றும் வாழ்க்கை வரலாறு.",
    descEn: "Speeches, military philosophies, and detailed biographical studies of national leadership.",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let books: BookItem[] = allBooks;
  let blogPosts: BlogPostSlideSource[] = [];
  let displayCategories = defaultHomeCategories;
  let announcements: AnnouncementItem[] = DEFAULT_ANNOUNCEMENTS;

  try {
    const supabase = await createClient();
    const [{ data: dbBooks }, { data: dbPosts }, { data: dbCategories }, liveAnnouncements] =
      await Promise.all([
        (supabase.from("books") as any)
          .select("*, categories(name_ta, name_en, slug)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .order("sort_order", { ascending: true }),
        (supabase.from("blog_posts") as any)
          .select("slug, cover_image_url, cover_image")
          .eq("status", "published"),
        (supabase.from("categories") as any)
          .select("id, slug, name_ta, name_en, description_ta, description_en, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        fetchActiveAnnouncements(supabase),
      ]);

    announcements = liveAnnouncements;

    if (dbBooks && dbBooks.length > 0) {
      books = dbBooks.map((b: any) =>
        mapDbBookToBookItem(b, allBooks.find((sb) => sb.slug === b.slug))
      );
    }
    if (Array.isArray(dbPosts)) {
      blogPosts = dbPosts;
    }
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      const defaultsBySlug = new Map(defaultHomeCategories.map((c) => [c.slug, c]));
      displayCategories = dbCategories.map((cat: any) => {
        const fallback = defaultsBySlug.get(cat.slug);
        return {
          nameTa: cat.name_ta || cat.name_en,
          nameEn: cat.name_en || cat.name_ta,
          slug: cat.slug,
          countTa: fallback?.countTa || "நூல்கள்",
          countEn: fallback?.countEn || "Publications",
          descTa:
            cat.description_ta ||
            fallback?.descTa ||
            `${cat.name_ta || cat.name_en} பிரிவின் கீழ் தொகுக்கப்பட்ட அரிய நூல்கள் மற்றும் ஆவணங்கள்.`,
          descEn:
            cat.description_en ||
            fallback?.descEn ||
            `Curated publications and archival volumes filed under ${cat.name_en || cat.name_ta}.`,
        };
      });
    }
  } catch (err) {
    console.error("Failed to fetch books on HomePage:", err);
  }

  const heroSlides =
    books.length > 0 || blogPosts.length > 0
      ? buildDynamicHeroSlides(books, blogPosts)
      : defaultHeroSlides;

  const spotlightBook =
    books.find((b) => b.featured) ||
    books.find((b) => b.slug === "katunayake-attack-victory") ||
    books[0];

  const homeCategoryTabs = displayCategories.map((cat) => ({
    id: cat.slug,
    labelTa: cat.nameTa,
    labelEn: cat.nameEn,
  }));

  const categoryCounts = books.reduce<Record<string, number>>((acc, item) => {
    const slug = item.categorySlug || "history";
    acc[slug] = (acc[slug] || 0) + 1;
    return acc;
  }, {});

  const spotlightImage = spotlightBook
    ? spotlightBook.image.startsWith("http") || spotlightBook.image.startsWith("/")
      ? spotlightBook.image
      : `/${spotlightBook.image}`
    : "/images/books/book-placeholder.webp";

  return (
    <div className="space-y-16 sm:space-y-24 pb-24">
      {/* ============================================================
          1. SLIDE-BASED HERO CAROUSEL CONNECTED DYNAMICALLY TO SUPABASE
          ============================================================ */}
      <HeroSlider slides={heroSlides} priorityIndex={0} />

      {/* ============================================================
          2. ASYMMETRICAL EDITORIAL BENTO GRID & RECENT ANNOUNCEMENTS
          ============================================================ */}
      <HomeBentoAndAnnouncements
        spotlightBook={spotlightBook}
        spotlightImage={spotlightImage}
        announcements={announcements}
      />

      {/* ============================================================
          3. HISTORICAL QUOTE BANNER
          ============================================================ */}
      <HomeQuoteBanner />

      {/* ============================================================
          4. INTERACTIVE FILTERABLE BOOK CATALOG (Tactile Physical Books)
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <CategoryFilterTabs books={books} categories={homeCategoryTabs} />
      </section>

      {/* ============================================================
          5. CURATED ARCHIVAL TAXONOMY DIRECTORY
          ============================================================ */}
      <HomeTaxonomySection
        categories={displayCategories}
        categoryCounts={categoryCounts}
      />
    </div>
  );
}

import * as React from "react";
import type { Metadata } from "next";
import { BlogCatalogClient } from "@/components/blog/BlogCatalogClient";
import { safeJsonLdStringify } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import type { ArticleCardData } from "@/components/blog/ArticleCard";
import { resolveBilingualPair } from "@/lib/i18n";
import { getSupabaseStorageUrl } from "@/lib/book-images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "செய்திகள் & ஆவணப் பதிவுகள் — Articles, News & Archival Records | மேதகு களஞ்சியம்",
  description:
    "தமிழீழ விடுதலைப் போராட்ட வரலாற்று ஆவணங்கள், நினைவுக் குறிப்புகள், கள ஆய்வுக் கட்டுரைகள் மற்றும் அதிகாரப்பூர்வ அறிவிப்புகள்.",
  alternates: {
    canonical: "https://methagukalanjiyam.in/blog",
  },
  openGraph: {
    title: "செய்திகள் & ஆவணப் பதிவுகள் — Articles & Archival Records",
    description:
      "தமிழீழ விடுதலைப் போராட்ட வரலாற்று ஆவணங்கள், நினைவுக் குறிப்புகள் மற்றும் வரலாற்று ஆய்வுக் கட்டுரைகள்.",
    url: "https://methagukalanjiyam.in/blog",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/banner-1200.webp",
        width: 1200,
        height: 675,
        alt: "மேதகு களஞ்சியம் கட்டுரைகள்",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "செய்திகள் & ஆவணப் பதிவுகள் — Articles & Archival Records",
    description: "தமிழீழ விடுதலைப் போராட்ட வரலாற்று ஆவணங்கள் மற்றும் ஆய்வுக் கட்டுரைகள்.",
    images: ["/images/brand/banner-1200.webp"],
  },
};

export default async function BlogPage() {
  let initialArticles: ArticleCardData[] | undefined;

  try {
    const supabase = await createClient();
    const { data: dbPosts, error: blogPostsErr } = await (supabase.from("blog_posts") as any)
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false });

    if (!blogPostsErr && dbPosts && dbPosts.length > 0) {
      initialArticles = dbPosts.map((p: any) => {
        const titlePair = resolveBilingualPair({ en: p.title_en ?? p.seo_title, ta: p.title_ta, legacy: p.title });
        const excerptPair = resolveBilingualPair({ en: p.excerpt_en ?? p.seo_description, ta: p.excerpt_ta, legacy: p.excerpt });
        const catPair = resolveBilingualPair({ en: p.category_en, ta: p.category_ta, legacy: "Historical Record" });
        return {
          slug: p.slug,
          titleTa: titlePair.ta || titlePair.en || p.title,
          titleEn: titlePair.en || titlePair.ta || p.title,
          excerptTa: excerptPair.ta || excerptPair.en || "",
          excerptEn: excerptPair.en || excerptPair.ta || "",
          coverImage: p.cover_image_url || p.cover_image || getSupabaseStorageUrl("blog", "thalapathi-vinayagam-banner.webp"),
          coverAltTa: p.cover_alt_ta || undefined,
          coverAltEn: p.cover_alt_en || undefined,
          categoryTa: catPair.ta || "வரலாற்று ஆவணம்",
          categoryEn: catPair.en || "Historical Record",
          publishedAt: p.published_at ? p.published_at.split("T")[0] : "2026-08-01",
          readingTimeMinutes: p.reading_time_mins || 5,
          featured: p.sort_order <= 1,
        };
      });
    } else {
      // Query blogs table
      const { data: legacyBlogs } = await (supabase.from("blogs") as any)
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false });

      if (legacyBlogs && legacyBlogs.length > 0) {
        initialArticles = legacyBlogs.map((b: any) => {
          const titlePair = resolveBilingualPair({ en: b.title_en ?? b.meta_title, ta: b.title_ta, legacy: b.title });
          const excerptPair = resolveBilingualPair({ en: b.excerpt_en ?? b.meta_description, ta: b.excerpt_ta, legacy: b.excerpt });
          return {
            slug: b.slug,
            titleTa: titlePair.ta || titlePair.en || b.title,
            titleEn: titlePair.en || titlePair.ta || b.title,
            excerptTa: excerptPair.ta || excerptPair.en || "",
            excerptEn: excerptPair.en || excerptPair.ta || "",
            coverImage: b.cover_image || getSupabaseStorageUrl("blog", "thalapathi-vinayagam-banner.webp"),
            categoryTa: "வரலாற்று ஆவணம்",
            categoryEn: "Historical Record",
            publishedAt: b.published_at ? b.published_at.split("T")[0] : "2026-08-01",
            readingTimeMinutes: b.reading_time_mins || 5,
            featured: true,
          };
        });
      }
    }
  } catch {
    // Keep fallback static articles
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://methagukalanjiyam.in/blog#collection",
        name: "செய்திகள் & ஆவணப் பதிவுகள் — Articles & Archives",
        url: "https://methagukalanjiyam.in/blog",
        description: "Historical articles, memoirs, and national archives from Methagu Kalanjiyam.",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://methagukalanjiyam.in/#website",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://methagukalanjiyam.in/blog#breadcrumb",
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
            name: "செய்திகள் & பதிவுகள்",
            item: "https://methagukalanjiyam.in/blog",
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
      <BlogCatalogClient initialArticles={initialArticles} />
    </>
  );
}

import * as React from "react";
import type { Metadata } from "next";
import { BlogCatalogClient } from "@/components/blog/BlogCatalogClient";
import { mapAnnouncementRecordToItem, type AnnouncementItem } from "@/lib/announcements";
import { safeJsonLdStringify } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import type { ArticleCardData } from "@/components/blog/ArticleCard";
import { resolveBilingualPair } from "@/lib/i18n";
import {
  mergeBlogPostsAndLegacyBlogs,
  resolveArticleCategoryPair,
  resolveBlogCoverUrl,
} from "@/lib/blog-utils";

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
  let initialAnnouncements: AnnouncementItem[] | undefined;

  try {
    const supabase = await createClient();
    const [{ data: dbPosts }, { data: legacyBlogs }, { data: dbAnnouncements, error: annErr }] =
      await Promise.all([
        (supabase.from("blog_posts") as any)
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .order("published_at", { ascending: false, nullsFirst: false }),
        (supabase.from("blogs") as any)
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .order("published_at", { ascending: false, nullsFirst: false }),
        (supabase.from("announcements") as any)
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);

    if (!annErr && Array.isArray(dbAnnouncements)) {
      initialAnnouncements = dbAnnouncements.map(mapAnnouncementRecordToItem);
    } else if (annErr) {
      const { data: settingsRow } = await (supabase.from("site_settings") as any)
        .select("value")
        .eq("key", "recent_announcements")
        .maybeSingle();
      if (Array.isArray(settingsRow?.value)) {
        initialAnnouncements = settingsRow.value
          .filter((item: any) => item?.is_active !== false)
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map(mapAnnouncementRecordToItem);
      }
    }

    const combinedPosts = mergeBlogPostsAndLegacyBlogs(dbPosts || [], legacyBlogs || []);

    if (combinedPosts.length > 0) {
      initialArticles = combinedPosts.map((p: any) => {
        const titlePair = resolveBilingualPair({
          en: p.title_en ?? p.seo_title,
          ta: p.title_ta,
          legacy: p.title,
        });
        const excerptPair = resolveBilingualPair({
          en: p.excerpt_en ?? p.seo_description,
          ta: p.excerpt_ta,
          legacy: p.excerpt,
        });
        const catPair = resolveArticleCategoryPair(p.category_en, p.category_ta);
        return {
          slug: p.slug,
          titleTa: titlePair.ta || titlePair.en || p.title,
          titleEn: titlePair.en || titlePair.ta || p.title,
          excerptTa: excerptPair.ta || excerptPair.en || "",
          excerptEn: excerptPair.en || excerptPair.ta || "",
          coverImage: resolveBlogCoverUrl(p.cover_image_url || p.cover_image),
          coverAltTa: p.cover_alt_ta || undefined,
          coverAltEn: p.cover_alt_en || undefined,
          categoryTa: catPair.ta,
          categoryEn: catPair.en,
          publishedAt: p.published_at ? p.published_at.split("T")[0] : "2026-08-01",
          readingTimeMinutes: p.reading_time_mins || 5,
          featured: (p.sort_order ?? 99) <= 1,
        };
      });
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
      <BlogCatalogClient
        initialArticles={initialArticles}
        initialAnnouncements={initialAnnouncements}
      />
    </>
  );
}

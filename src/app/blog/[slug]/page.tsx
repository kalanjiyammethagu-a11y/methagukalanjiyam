import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailClient } from "@/components/blog/ArticleDetailClient";
import { getArticleBySlug, getAllArticleSlugs, type ArticleDetailData } from "@/data/articles";
import { safeJsonLdStringify } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import { localized, resolveBilingualPair } from "@/lib/i18n";
import {
  normalizeLegacyBlogRow,
  resolveArticleCategoryPair,
  resolveBlogCoverUrl,
} from "@/lib/blog-utils";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

async function resolveArticle(slug: string): Promise<ArticleDetailData | undefined> {
  const staticArticle = getArticleBySlug(slug);
  try {
    const supabase = await createClient();
    const { data: dbPost } = await (supabase.from("blog_posts") as any)
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    let post = dbPost;
    if (!post) {
      const { data: legacyPost } = await (supabase.from("blogs") as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (legacyPost) {
        post = normalizeLegacyBlogRow(legacyPost);
      }
    }

    if (post) {
      const titlePair = resolveBilingualPair({
        en: post.title_en ?? post.seo_title ?? staticArticle?.titleEn,
        ta: post.title_ta ?? staticArticle?.titleTa,
        legacy: post.title,
      });
      const subtitlePair = resolveBilingualPair({
        en: post.excerpt_en ?? post.seo_description ?? staticArticle?.subtitleEn,
        ta: post.excerpt_ta ?? staticArticle?.subtitleTa,
        legacy: post.excerpt,
      });
      const bodyPair = resolveBilingualPair({
        en: post.body_en ?? staticArticle?.htmlContentEn,
        ta: post.body_ta ?? staticArticle?.htmlContentTa,
        legacy: post.body,
      });
      const authorPair = resolveBilingualPair({
        en: post.author_en ?? staticArticle?.authorEn,
        ta: post.author_ta ?? staticArticle?.authorTa,
        legacy: post.author || "சாந்தி நேசக்கரம்",
      });
      const catPair = resolveArticleCategoryPair(
        post.category_en ?? staticArticle?.categoryEn,
        post.category_ta ?? staticArticle?.categoryTa
      );

      return {
        slug: post.slug,
        titleTa: titlePair.ta || titlePair.en || staticArticle?.titleTa || post.title,
        titleEn: titlePair.en || titlePair.ta || staticArticle?.titleEn || post.title,
        subtitleTa: subtitlePair.ta || subtitlePair.en || staticArticle?.subtitleTa || "",
        subtitleEn: subtitlePair.en || subtitlePair.ta || staticArticle?.subtitleEn || "",
        coverImage: resolveBlogCoverUrl(post.cover_image_url || post.cover_image || staticArticle?.coverImage),
        coverAltTa: post.cover_alt_ta || undefined,
        coverAltEn: post.cover_alt_en || undefined,
        categoryTa: catPair.ta,
        categoryEn: catPair.en,
        publishedAt: post.published_at ? post.published_at.split("T")[0] : "2026-08-01",
        readingTimeMinutes: post.reading_time_mins || 5,
        authorTa: authorPair.ta || authorPair.en || "சாந்தி நேசக்கரம்",
        authorEn: authorPair.en || authorPair.ta || "Saanthi Nesakaram",
        relatedBookSlugs: staticArticle?.relatedBookSlugs || ["dhisai-thavara-kanai", "katunayake-attack-victory"],
        htmlContentTa: bodyPair.ta || bodyPair.en || staticArticle?.htmlContentTa || "",
        htmlContentEn: bodyPair.en || bodyPair.ta || staticArticle?.htmlContentEn || "",
      };
    }
  } catch {
    // Keep fallback static article
  }
  return staticArticle;
}

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await resolveArticle(slug);

  if (!article) {
    return {
      title: "ஆவணம் காணப்படவில்லை | Article Not Found — மேதகு களஞ்சியம்",
      description: "கோரப்பட்ட வரலாற்று ஆவணக் கட்டுரை களஞ்சியத்தில் காணப்படவில்லை.",
    };
  }

  const titleTa = localized(article, "title", "ta");
  const titleEn = localized(article, "title", "en");
  const title = titleTa === titleEn ? `${titleTa} — மேதகு களஞ்சியம்` : `${titleTa} | ${titleEn} — மேதகு களஞ்சியம்`;
  const description = `${localized(article, "subtitle", "ta") || localized(article, "subtitle", "en") || titleEn.slice(0, 160)}`;
  const ogImageUrl = article.coverImage.startsWith("http")
    ? article.coverImage
    : `https://methagukalanjiyam.in${article.coverImage.startsWith("/") ? "" : "/"}${article.coverImage}`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://methagukalanjiyam.in/blog/${article.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://methagukalanjiyam.in/blog/${article.slug}`,
      siteName: "மேதகு களஞ்சியம்",
      locale: "ta_IN",
      alternateLocale: ["en_IN"],
      type: "article",
      publishedTime: article.publishedAt,
      authors: [localized(article, "author", "ta", "மேதகு களஞ்சியம்")],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 675,
          alt: article.coverAltTa || article.coverAltEn || titleTa,
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

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await resolveArticle(slug);

  if (!article) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `https://methagukalanjiyam.in/blog/${article.slug}#article`,
        headline: localized(article, "title", "ta"),
        alternativeHeadline: localized(article, "title", "en"),
        description: localized(article, "subtitle", "ta") || localized(article, "subtitle", "en"),
        image: article.coverImage.startsWith("http")
          ? article.coverImage
          : `https://methagukalanjiyam.in${article.coverImage.startsWith("/") ? "" : "/"}${article.coverImage}`,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        inLanguage: ["ta", "en"],
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://methagukalanjiyam.in/blog/${article.slug}`,
        },
        author: {
          "@type": "Person",
          name: article.authorTa,
          alternateName: article.authorEn,
        },
        publisher: {
          "@type": "BookStore",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
          logo: {
            "@type": "ImageObject",
            url: "https://methagukalanjiyam.in/icons/favicon.png",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://methagukalanjiyam.in/blog/${article.slug}#breadcrumb`,
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
          {
            "@type": "ListItem",
            position: 3,
            name: article.titleTa,
            item: `https://methagukalanjiyam.in/blog/${article.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(articleSchema) }}
      />
      <ArticleDetailClient article={article} />
    </>
  );
}

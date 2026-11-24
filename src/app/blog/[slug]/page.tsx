import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailClient } from "@/components/blog/ArticleDetailClient";
import { getArticleBySlug, getAllArticleSlugs } from "@/data/articles";
import { safeJsonLdStringify } from "@/lib/sanitize";

export const revalidate = 60;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
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
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "ஆவணம் காணப்படவில்லை | Article Not Found — மேதகு களஞ்சியம்",
      description: "கோரப்பட்ட வரலாற்று ஆவணக் கட்டுரை களஞ்சியத்தில் காணப்படவில்லை.",
    };
  }

  const title = `${article.titleTa} — மேதகு களஞ்சியம்`;
  const description = `${article.subtitleTa || article.titleEn.slice(0, 160)}`;
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
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.authorTa || "மேதகு களஞ்சியம்"],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 675,
          alt: article.titleTa,
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
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `https://methagukalanjiyam.in/blog/${article.slug}#article`,
        headline: article.titleTa,
        alternativeHeadline: article.titleEn,
        description: article.subtitleTa,
        image: article.coverImage.startsWith("http")
          ? article.coverImage
          : `https://methagukalanjiyam.in${article.coverImage.startsWith("/") ? "" : "/"}${article.coverImage}`,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        inLanguage: "ta",
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

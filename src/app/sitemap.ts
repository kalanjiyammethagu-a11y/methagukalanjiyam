import type { MetadataRoute } from "next";
import { allBooks } from "@/data/books";
import { detailedArticles, getAllArticleSlugs } from "@/data/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://methagukalanjiyam.in";
  const buildDate = new Date("2026-11-24");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: buildDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: buildDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: buildDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified: buildDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/supporters`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/certificate`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const bookRoutes: MetadataRoute.Sitemap = allBooks.map((book) => ({
    url: `${baseUrl}/books/${book.slug}`,
    lastModified: buildDate,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const blogRoutes: MetadataRoute.Sitemap = getAllArticleSlugs().map((slug) => {
    const article = detailedArticles[slug];
    const pubDate = article?.publishedAt ? new Date(article.publishedAt) : buildDate;
    return {
      url: `${baseUrl}/blog/${slug}`,
      lastModified: pubDate,
      changeFrequency: "monthly",
      priority: 0.75,
    };
  });

  return [...staticRoutes, ...bookRoutes, ...blogRoutes];
}

import type { MetadataRoute } from "next";
import { allBooks } from "@/data/books";
import { detailedArticles, getAllArticleSlugs } from "@/data/articles";
import { toAbsoluteSiteImageUrl } from "@/lib/book-images";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://methagukalanjiyam.in").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/supporters`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/certificate`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const bookMap = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const book of allBooks) {
    bookMap.set(book.slug, {
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
      images: [
        toAbsoluteSiteImageUrl(book.image, baseUrl),
        ...(book.galleryImages || []).map((g) => toAbsoluteSiteImageUrl(g.url, baseUrl)),
      ],
    });
  }

  const blogMap = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const slug of getAllArticleSlugs()) {
    const article = detailedArticles[slug];
    blogMap.set(slug, {
      url: `${baseUrl}/blog/${slug}`,
      lastModified: article?.publishedAt ? new Date(article.publishedAt) : now,
      changeFrequency: "monthly",
      priority: 0.75,
    });
  }

  try {
    const isPlaceholderDb =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isPlaceholderDb) {
      const supabase = await createClient();
      const [{ data: dbBooks }, { data: dbPosts }] = await Promise.all([
        (supabase.from("books") as any)
          .select("slug, updated_at, cover_front, cover_image_url")
          .eq("status", "published"),
        (supabase.from("blog_posts") as any)
          .select("slug, published_at, updated_at")
          .eq("status", "published"),
      ]);

      if (Array.isArray(dbBooks)) {
        for (const b of dbBooks) {
          if (!b?.slug) continue;
          const img = b.cover_front || b.cover_image_url;
          const existing = bookMap.get(b.slug);
          bookMap.set(b.slug, {
            url: `${baseUrl}/books/${b.slug}`,
            lastModified: b.updated_at ? new Date(b.updated_at) : now,
            changeFrequency: "weekly",
            priority: 0.85,
            images: img ? [toAbsoluteSiteImageUrl(img, baseUrl)] : existing?.images,
          });
        }
      }

      if (Array.isArray(dbPosts)) {
        for (const p of dbPosts) {
          if (!p?.slug) continue;
          blogMap.set(p.slug, {
            url: `${baseUrl}/blog/${p.slug}`,
            lastModified: p.updated_at
              ? new Date(p.updated_at)
              : p.published_at
              ? new Date(p.published_at)
              : now,
            changeFrequency: "monthly",
            priority: 0.75,
          });
        }
      }
    }
  } catch {
    // Static fallback already populated
  }

  return [...staticRoutes, ...Array.from(bookMap.values()), ...Array.from(blogMap.values())];
}

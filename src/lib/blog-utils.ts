import { getSupabaseStorageUrl } from "@/lib/book-images";
import { sanitizeHtml } from "@/lib/sanitize";

export interface ArticleCategoryOption {
  slug: string;
  labelEn: string;
  labelTa: string;
  aliases: string[];
}

export const ARTICLE_CATEGORY_OPTIONS: ArticleCategoryOption[] = [
  {
    slug: "history",
    labelEn: "Historical Record",
    labelTa: "வரலாற்று ஆவணம்",
    aliases: ["history", "historical record", "historical", "வரலாற்று ஆவணம்", "வரலாறு"],
  },
  {
    slug: "memoir",
    labelEn: "Personal Memoir",
    labelTa: "நினைவுக் குறிப்பு",
    aliases: ["memoir", "memoirs", "personal memoir", "நினைவுக் குறிப்பு", "நினைவுகள்"],
  },
  {
    slug: "martyrdom",
    labelEn: "Martyrdom History",
    labelTa: "தியாக வரலாறு",
    aliases: ["martyrdom", "martyrdom history", "தியாக வரலாறு"],
  },
  {
    slug: "biography",
    labelEn: "Biography",
    labelTa: "வாழ்க்கை வரலாறு",
    aliases: ["biography", "biographies", "வாழ்க்கை வரலாறு"],
  },
  {
    slug: "analysis",
    labelEn: "Analysis & Essay",
    labelTa: "ஆய்வுக் கட்டுரை",
    aliases: ["analysis", "essay", "analysis & essay", "literature", "ஆய்வுக் கட்டுரை", "இலக்கிய உரையாடல்"],
  },
  {
    slug: "announcements",
    labelEn: "Announcements & News",
    labelTa: "அறிவிப்புகள் & செய்திகள்",
    aliases: ["announcements", "news", "announcements & news", "அறிவிப்புகள் & செய்திகள்", "செய்திகள்"],
  },
];

export const DEFAULT_BLOG_COVER = getSupabaseStorageUrl("blog", "thalapathi-vinayagam-banner.webp");

/**
 * Resolves article cover URLs, transparently migrating legacy `/images/blogs/<file>`
 * paths to the Supabase Storage `blog` bucket.
 */
export function resolveBlogCoverUrl(src?: string | null): string {
  const clean = src?.trim();
  if (!clean) return DEFAULT_BLOG_COVER;
  if (clean.startsWith("/images/blogs/")) {
    const fileName = clean.slice("/images/blogs/".length);
    return fileName ? getSupabaseStorageUrl("blog", fileName) : DEFAULT_BLOG_COVER;
  }
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/")) {
    return clean;
  }
  return `/${clean}`;
}

export function resolveArticleCategoryPair(
  categoryEn?: string | null,
  categoryTa?: string | null
): { en: string; ta: string } {
  const cleanEn = categoryEn?.trim() || "";
  const cleanTa = categoryTa?.trim() || "";
  const matched = ARTICLE_CATEGORY_OPTIONS.find(
    (opt) =>
      opt.aliases.includes(cleanEn.toLowerCase()) ||
      opt.aliases.includes(cleanTa.toLowerCase())
  );
  if (matched) {
    return {
      en: cleanEn || matched.labelEn,
      ta: cleanTa || matched.labelTa,
    };
  }
  return {
    en: cleanEn || "Historical Record",
    ta: cleanTa || "வரலாற்று ஆவணம்",
  };
}

export function matchesArticleCategory(
  article: { categoryEn?: string | null; categoryTa?: string | null },
  selectedSlug: string
): boolean {
  if (!selectedSlug || selectedSlug === "all") return true;
  const target = selectedSlug.trim().toLowerCase();
  const catEn = (article.categoryEn || "").trim().toLowerCase();
  const catTa = (article.categoryTa || "").trim().toLowerCase();

  const option = ARTICLE_CATEGORY_OPTIONS.find((opt) => opt.slug === target);
  if (option) {
    return option.aliases.some(
      (alias) => catEn === alias || catTa === alias || catEn.includes(alias) || catTa.includes(alias)
    );
  }
  return catEn.includes(target) || catTa.includes(target);
}

/**
 * Extracts body, author, and category strings from legacy `blogs` table rows where
 * content may be JSON `{ html }`, `{ body, body_en, body_ta }`, or a plain string.
 */
export function normalizeLegacyBlogRow(legacyPost: Record<string, any>): Record<string, any> {
  const content = legacyPost?.content;
  let contentBody = "";
  let contentBodyEn: string | null = null;
  let contentBodyTa: string | null = null;
  let contentAuthorEn: string | null = null;
  let contentAuthorTa: string | null = null;
  let contentCategoryEn: string | null = null;
  let contentCategoryTa: string | null = null;

  if (typeof content === "string") {
    contentBody = content;
  } else if (content && typeof content === "object") {
    contentBodyEn = typeof content.body_en === "string" ? content.body_en : null;
    contentBodyTa = typeof content.body_ta === "string" ? content.body_ta : null;
    contentAuthorEn = typeof content.author_en === "string" ? content.author_en : null;
    contentAuthorTa = typeof content.author_ta === "string" ? content.author_ta : null;
    contentCategoryEn = typeof content.category_en === "string" ? content.category_en : null;
    contentCategoryTa = typeof content.category_ta === "string" ? content.category_ta : null;
    contentBody =
      (typeof content.html === "string" && content.html) ||
      contentBodyTa ||
      contentBodyEn ||
      (typeof content.body === "string" && content.body) ||
      "";
  }

  return {
    ...legacyPost,
    title_en: legacyPost.title_en ?? legacyPost.meta_title ?? null,
    title_ta: legacyPost.title_ta ?? null,
    excerpt_en: legacyPost.excerpt_en ?? legacyPost.meta_description ?? null,
    excerpt_ta: legacyPost.excerpt_ta ?? null,
    body: contentBody,
    body_en: legacyPost.body_en ?? contentBodyEn ?? null,
    body_ta: legacyPost.body_ta ?? contentBodyTa ?? null,
    author: legacyPost.author || contentAuthorTa || contentAuthorEn || "சாந்தி நேசக்கரம்",
    author_en: legacyPost.author_en ?? contentAuthorEn ?? null,
    author_ta: legacyPost.author_ta ?? contentAuthorTa ?? null,
    category_en:
      legacyPost.category_en ??
      contentCategoryEn ??
      (Array.isArray(legacyPost.keywords) && legacyPost.keywords[0]) ??
      null,
    category_ta: legacyPost.category_ta ?? contentCategoryTa ?? null,
    cover_image_url: resolveBlogCoverUrl(legacyPost.cover_image_url || legacyPost.cover_image),
    seo_title: legacyPost.meta_title || legacyPost.title,
    seo_description: legacyPost.meta_description || legacyPost.excerpt,
    status:
      legacyPost.status === "draft" || legacyPost.status === "archived"
        ? legacyPost.status
        : legacyPost.is_published
        ? "published"
        : "draft",
  };
}

/**
 * Merges modern `blog_posts` with any non-duplicate rows in legacy `blogs` table,
 * ordered newest-first (`created_at DESC`, then `published_at DESC`).
 */
export function mergeBlogPostsAndLegacyBlogs(
  blogPosts: Record<string, any>[] = [],
  legacyBlogs: Record<string, any>[] = []
): Record<string, any>[] {
  const seenSlugs = new Set<string>();
  const merged: Record<string, any>[] = [];

  for (const post of blogPosts) {
    if (!post) continue;
    if (post.slug) seenSlugs.add(post.slug);
    merged.push({
      ...post,
      cover_image_url: resolveBlogCoverUrl(post.cover_image_url || post.cover_image),
    });
  }

  for (const legacy of legacyBlogs) {
    if (!legacy) continue;
    if (legacy.slug && seenSlugs.has(legacy.slug)) continue;
    if (legacy.slug) seenSlugs.add(legacy.slug);
    merged.push(normalizeLegacyBlogRow(legacy));
  }

  merged.sort((a, b) => {
    const aTime = new Date(a.created_at || a.published_at || 0).getTime();
    const bTime = new Date(b.created_at || b.published_at || 0).getTime();
    return bTime - aTime;
  });

  return merged;
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders both rich HTML article bodies AND plain-text newline-delimited bodies safely,
 * preventing HTML whitespace collapse on plain-text articles authored in Admin textareas.
 */
export function formatArticleBodyHtml(rawContent?: string | null): string {
  const raw = (rawContent || "").trim();
  if (!raw) return "";

  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|li|blockquote|table|section|article|pre|figure|br)\b/i.test(raw);
  if (hasBlockHtml) {
    return sanitizeHtml(raw);
  }

  const paragraphs = raw.split(/\r?\n\s*\r?\n+/).filter((block) => block.trim().length > 0);
  const isHeadingCandidate = (line: string) =>
    line.length <= 72 && !/[.!?。]$/.test(line);

  const htmlBlocks = paragraphs.map((block) => {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const chunks: string[] = [];
    let bodyStart = 0;

    if (lines.length === 1) {
      const single = lines[0]!;
      return isHeadingCandidate(single)
        ? `<h2>${escapeHtmlText(single)}</h2>`
        : `<p>${escapeHtmlText(single)}</p>`;
    }

    if (lines[0] && isHeadingCandidate(lines[0])) {
      chunks.push(`<h2>${escapeHtmlText(lines[0])}</h2>`);
      bodyStart = 1;
      if (lines.length >= 3 && lines[1] && isHeadingCandidate(lines[1])) {
        chunks.push(`<h3>${escapeHtmlText(lines[1])}</h3>`);
        bodyStart = 2;
      }
    }

    const bodyLines = lines.slice(bodyStart);
    if (bodyLines.length > 0) {
      chunks.push(`<p>${bodyLines.map(escapeHtmlText).join("<br />")}</p>`);
    }

    return chunks.join("");
  });

  return sanitizeHtml(htmlBlocks.join("\n"));
}

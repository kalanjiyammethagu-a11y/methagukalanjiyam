export interface BookGalleryImage {
  url: string;
  path?: string | null;
  kind?: "inside" | "back_cover" | "spread" | "other";
  alt_en?: string | null;
  alt_ta?: string | null;
}

export const BOOK_PLACEHOLDER_IMAGE = "/images/books/book-placeholder.webp";
export const SITE_ORIGIN = "https://methagukalanjiyam.in";

/**
 * Books whose authentic outside front cover could not be auto-confirmed
 * against the seed/storage image files and require manual admin verification.
 */
export const FLAGGED_BOOK_COVER_SLUGS = ["methagu-kalanjiyam-aavanam"] as const;

export function isFlaggedBookCoverSlug(slug?: string | null): boolean {
  if (!slug) return false;
  return (FLAGGED_BOOK_COVER_SLUGS as readonly string[]).includes(slug);
}

/**
 * Resolves the authoritative outside/front cover URL for a book record.
 * Never promotes gallery/back/inside images over explicit front cover fields.
 */
export function resolveBookFrontCover(
  row: {
    slug?: string | null;
    cover_is_front?: boolean | null;
    cover_image_url?: string | null;
    cover_front?: string | null;
    cover_url?: string | null;
    image?: string | null;
    cover_image_path?: string | null;
  },
  fallbackImage?: string | null
): { url: string; path: string | null; isFront: boolean; isPlaceholder: boolean } {
  const candidate =
    [row.cover_image_url, row.cover_front, row.cover_url, row.image, fallbackImage]
      .find((value) => typeof value === "string" && value.trim().length > 0)
      ?.trim() || BOOK_PLACEHOLDER_IMAGE;

  const isPlaceholder = candidate === BOOK_PLACEHOLDER_IMAGE;
  const isFront =
    row.cover_is_front === false
      ? false
      : !isPlaceholder && !isFlaggedBookCoverSlug(row.slug);

  return {
    url: candidate,
    path: row.cover_image_path?.trim() || null,
    isFront,
    isPlaceholder,
  };
}

/**
 * Normalizes `gallery_images` JSON/array payloads into an ordered list of
 * secondary images (inside pages / back cover), deduplicating against the front cover.
 */
export function normalizeGalleryImages(
  rawGallery: unknown,
  legacyCoverBack?: string | null,
  frontCoverUrl?: string | null
): BookGalleryImage[] {
  let parsed: unknown = rawGallery;
  if (typeof rawGallery === "string") {
    try {
      parsed = JSON.parse(rawGallery);
    } catch {
      parsed = [];
    }
  }

  const normalized: BookGalleryImage[] = [];
  const seenUrls = new Set<string>();
  if (frontCoverUrl && frontCoverUrl.trim()) {
    seenUrls.add(frontCoverUrl.trim());
  }

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (typeof entry === "string") {
        const cleanUrl = entry.trim();
        if (!cleanUrl || seenUrls.has(cleanUrl)) continue;
        seenUrls.add(cleanUrl);
        normalized.push({ url: cleanUrl, path: null, kind: "inside" });
      } else if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        const cleanUrl = typeof obj.url === "string" ? obj.url.trim() : "";
        if (!cleanUrl || seenUrls.has(cleanUrl)) continue;
        seenUrls.add(cleanUrl);
        const rawKind = obj.kind;
        const kind: BookGalleryImage["kind"] =
          rawKind === "back_cover" || rawKind === "spread" || rawKind === "other" || rawKind === "inside"
            ? rawKind
            : "inside";
        normalized.push({
          url: cleanUrl,
          path: typeof obj.path === "string" && obj.path.trim() ? obj.path.trim() : null,
          kind,
          alt_en: typeof obj.alt_en === "string" && obj.alt_en.trim() ? obj.alt_en.trim() : null,
          alt_ta: typeof obj.alt_ta === "string" && obj.alt_ta.trim() ? obj.alt_ta.trim() : null,
        });
      }
    }
  }

  const cleanBack = legacyCoverBack?.trim();
  if (cleanBack && !seenUrls.has(cleanBack)) {
    seenUrls.add(cleanBack);
    normalized.push({
      url: cleanBack,
      path: null,
      kind: "back_cover",
      alt_en: "Back cover",
      alt_ta: "பின் அட்டை",
    });
  }

  return normalized;
}

/**
 * Returns a clean relative Supabase Storage object path, or null for static `/images/...`
 * and full HTTP(S) URLs so orphan cleanup never tries to delete non-storage URLs.
 */
export function sanitizeBookStoragePath(path?: string | null): string | null {
  const clean = path?.trim();
  if (!clean || clean.startsWith("/images/") || clean.startsWith("http")) {
    return null;
  }
  return clean;
}

/**
 * Extracts Supabase Storage relative object paths from a normalized gallery list
 * (excluding static `/images/...` and bare external URLs without storage paths).
 */
export function extractBookGalleryPaths(gallery: BookGalleryImage[]): string[] {
  const paths = new Set<string>();
  for (const item of gallery) {
    const clean = sanitizeBookStoragePath(item.path);
    if (clean) {
      paths.add(clean);
    }
  }
  return Array.from(paths);
}

/**
 * Converts a relative or full image URL into an absolute HTTPS URL without double-prefixing.
 */
export function toAbsoluteSiteImageUrl(
  imageSrc?: string | null,
  origin: string = SITE_ORIGIN
): string {
  const clean = imageSrc?.trim();
  if (!clean) return `${origin}${BOOK_PLACEHOLDER_IMAGE}`;
  if (clean.startsWith("https://") || clean.startsWith("http://")) {
    return clean;
  }
  return clean.startsWith("/") ? `${origin}${clean}` : `${origin}/${clean}`;
}

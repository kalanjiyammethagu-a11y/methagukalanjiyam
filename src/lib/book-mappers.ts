import type { BookItem } from "@/data/books";
import { normalizeGalleryImages, resolveBookFrontCover } from "@/lib/book-images";
import { resolveBilingualPair } from "@/lib/i18n";

/**
 * Shared DB-row -> BookItem mapper with front-cover primacy and EN/TA bilingual resolution.
 */
export function mapDbBookToBookItem(
  b: any,
  staticFallback?: BookItem
): BookItem & { whatsappLink?: string | null } {
  const titlePair = resolveBilingualPair({
    en: b.title_en ?? staticFallback?.titleEn,
    ta: b.title_ta ?? staticFallback?.titleTa ?? staticFallback?.title,
    legacy: b.title,
  });

  const authorPair = resolveBilingualPair({
    en: b.author_en ?? staticFallback?.authorEn,
    ta: b.author_ta ?? staticFallback?.authorTa ?? staticFallback?.author,
    legacy: b.author,
  });

  const descPair = resolveBilingualPair({
    en: b.description_en ?? staticFallback?.descriptionEn,
    ta: b.description_ta ?? staticFallback?.descriptionTa,
    legacy: b.description,
  });

  const publisherPair = resolveBilingualPair({
    en: b.publisher_en ?? staticFallback?.publisherEn,
    ta: b.publisher_ta ?? staticFallback?.publisher,
    legacy: b.publisher || "மேதகு களஞ்சியம்",
  });

  const quotePair = resolveBilingualPair({
    en: b.quote_en ?? staticFallback?.quoteEn,
    ta: b.quote_ta ?? staticFallback?.quoteTa,
    legacy: undefined,
  });

  const cover = resolveBookFrontCover(b, staticFallback?.image);
  const galleryImages = normalizeGalleryImages(
    b.gallery_images,
    b.cover_back,
    cover.url
  );

  return {
    id: b.id,
    slug: b.slug,
    title: titlePair.ta || titlePair.en || b.title,
    titleTa: titlePair.ta || staticFallback?.titleTa || staticFallback?.title,
    titleEn: titlePair.en || staticFallback?.titleEn || b.title,
    author: authorPair.ta || authorPair.en || b.author,
    authorTa: authorPair.ta || staticFallback?.authorTa || staticFallback?.author,
    authorEn: authorPair.en || staticFallback?.authorEn || b.author,
    price: Number(b.price),
    discountPrice: b.discount_price ? Number(b.discount_price) : null,
    stock: Number(b.stock ?? staticFallback?.stock ?? 10),
    categorySlug: (b.categories?.slug || staticFallback?.categorySlug || "history") as BookItem["categorySlug"],
    categoryTa: b.categories?.name_ta || staticFallback?.categoryTa || "வரலாறு",
    categoryEn: b.categories?.name_en || staticFallback?.categoryEn || "History",
    image: cover.url,
    coverIsFront: cover.isFront,
    coverAltEn: b.cover_alt_en || staticFallback?.coverAltEn || undefined,
    coverAltTa: b.cover_alt_ta || staticFallback?.coverAltTa || undefined,
    galleryImages: galleryImages.length > 0 ? galleryImages : staticFallback?.galleryImages,
    featured: Boolean(b.is_featured ?? staticFallback?.featured),
    pages: b.pages || staticFallback?.pages,
    year: String(b.published_year || b.publication_year || staticFallback?.year || "2024"),
    publisher: publisherPair.ta || "மேதகு களஞ்சியம்",
    publisherEn: publisherPair.en || "Methagu Kalanjiyam",
    isbn: b.isbn || staticFallback?.isbn,
    descriptionTa: descPair.ta || staticFallback?.descriptionTa || "",
    descriptionEn: descPair.en || staticFallback?.descriptionEn || "",
    quoteTa: quotePair.ta || staticFallback?.quoteTa,
    quoteEn: quotePair.en || staticFallback?.quoteEn,
    whatsappLink: b.whatsapp_link || null,
  };
}

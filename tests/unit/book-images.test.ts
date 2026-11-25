import test from "node:test";
import assert from "node:assert/strict";
import {
  BOOK_PLACEHOLDER_IMAGE,
  extractBookGalleryPaths,
  isFlaggedBookCoverSlug,
  normalizeGalleryImages,
  resolveBookFrontCover,
  sanitizeBookStoragePath,
  toAbsoluteSiteImageUrl,
} from "../../src/lib/book-images.ts";

test("resolveBookFrontCover prioritizes outside cover fields over placeholder", () => {
  const res = resolveBookFrontCover({
    slug: "dhisai-thavara-kanai",
    cover_image_url: "https://example.supabase.co/storage/v1/object/public/books/book-13.webp",
    cover_front: "/images/books/old.webp",
    cover_image_path: "book-13.webp",
  });

  assert.equal(res.url, "https://example.supabase.co/storage/v1/object/public/books/book-13.webp");
  assert.equal(res.path, "book-13.webp");
  assert.equal(res.isFront, true);
  assert.equal(res.isPlaceholder, false);
});

test("resolveBookFrontCover marks methagu-kalanjiyam-aavanam and placeholder covers as unverified front", () => {
  const flagged = resolveBookFrontCover({
    slug: "methagu-kalanjiyam-aavanam",
    cover_image_url: BOOK_PLACEHOLDER_IMAGE,
  });
  assert.equal(isFlaggedBookCoverSlug("methagu-kalanjiyam-aavanam"), true);
  assert.equal(flagged.isFront, false);
  assert.equal(flagged.isPlaceholder, true);

  const explicitFalse = resolveBookFrontCover({
    slug: "other-book",
    cover_image_url: "https://example.supabase.co/storage/v1/object/public/books/custom.webp",
    cover_is_front: false,
  });
  assert.equal(explicitFalse.isFront, false);
});

test("normalizeGalleryImages keeps inside pages ordered, preserves distinct back cover, and deduplicates front cover", () => {
  const front = "https://example.supabase.co/storage/v1/object/public/books/book-10.webp";
  const gallery = normalizeGalleryImages(
    [
      front,
      { url: "https://example.supabase.co/storage/v1/object/public/books/page-1.webp", path: "page-1.webp", kind: "inside" },
      { url: "https://example.supabase.co/storage/v1/object/public/books/page-2.webp", path: "page-2.webp", kind: "spread" },
    ],
    "https://example.supabase.co/storage/v1/object/public/books/back-10.webp",
    front
  );

  assert.equal(gallery.length, 3);
  assert.equal(gallery[0].url.endsWith("page-1.webp"), true);
  assert.equal(gallery[1].kind, "spread");
  assert.equal(gallery[2].kind, "back_cover");
  assert.deepEqual(extractBookGalleryPaths(gallery), ["page-1.webp", "page-2.webp"]);
});

test("toAbsoluteSiteImageUrl never double-prefixes https URLs (JSON-LD & sitemap fix)", () => {
  assert.equal(
    toAbsoluteSiteImageUrl("https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/books/book-13.webp"),
    "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/books/book-13.webp"
  );
  assert.equal(
    toAbsoluteSiteImageUrl("/images/books/book-placeholder.webp"),
    "https://methagukalanjiyam.in/images/books/book-placeholder.webp"
  );
  assert.equal(sanitizeBookStoragePath("  abc-123.webp  "), "abc-123.webp");
  assert.equal(sanitizeBookStoragePath("/images/books/book-placeholder.webp"), null);
  assert.equal(sanitizeBookStoragePath("https://example.supabase.co/storage/v1/object/public/books/x.webp"), null);
});

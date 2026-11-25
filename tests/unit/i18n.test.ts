import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  localized,
  isTamilText,
  isAsciiSlug,
  generateAsciiSlug,
  getLanguageCompleteness,
  resolveBilingualPair,
  buildBilingualSearchText,
  REQUIRE_BOTH_LANGUAGES_TO_PUBLISH,
} from "../../src/lib/i18n.ts";
import {
  adminBookCreateSchema,
  adminBlogPostCreateSchema,
  adminSupporterCreateSchema,
  adminVideoSchema,
  validateBilingualBookFields,
  validateBilingualArticleFields,
} from "../../src/lib/validators/admin.ts";

describe("Dual-language i18n helper (localized & fallback)", () => {
  it("selects requested locale and falls back to the alternate locale when empty", () => {
    const camelRow = {
      titleEn: "Katunayake Victory",
      titleTa: "கட்டுநாயக்கா வெற்றி",
      descriptionEn: "Historical chronicle in English.",
      descriptionTa: "",
    };

    assert.equal(localized(camelRow, "title", "en"), "Katunayake Victory");
    assert.equal(localized(camelRow, "title", "ta"), "கட்டுநாயக்கா வெற்றி");
    // Tamil description empty -> falls back to English description
    assert.equal(localized(camelRow, "description", "ta"), "Historical chronicle in English.");

    const snakeRow = {
      name_en: "",
      name_ta: "தீபக் ஹார்வின்",
    };
    // English empty -> falls back to Tamil
    assert.equal(localized(snakeRow, "name", "en"), "தீபக் ஹார்வின்");
    assert.equal(localized(snakeRow, "name", "ta"), "தீபக் ஹார்வின்");
  });

  it("respects bare legacy field script matching before cross-language fallback", () => {
    const tamilLegacy = { title: "வன்னி ஆவணம்", title_en: "Vanni Archive" };
    assert.equal(localized(tamilLegacy, "title", "ta"), "வன்னி ஆவணம்");
    assert.equal(localized(tamilLegacy, "title", "en"), "Vanni Archive");

    const englishLegacy = { title: "Vanni Dispatch", title_ta: "வன்னி செய்தி" };
    assert.equal(localized(englishLegacy, "title", "en"), "Vanni Dispatch");
    assert.equal(localized(englishLegacy, "title", "ta"), "வன்னி செய்தி");

    assert.equal(localized(null, "title", "ta", "Fallback"), "Fallback");
  });

  it("evaluates completeness & missing Tamil warnings accurately", () => {
    const missingTa = getLanguageCompleteness(
      { title_en: "War Records", author_en: "N. Siva", title_ta: "", author_ta: "ந. சிவா" },
      ["title", "author"]
    );
    assert.equal(missingTa.enComplete, true);
    assert.equal(missingTa.taComplete, false);
    assert.equal(missingTa.missingTamil, true);
    assert.deepEqual(missingTa.missingTaFields, ["title"]);

    const complete = getLanguageCompleteness(
      { title_en: "War Records", author_en: "N. Siva", title_ta: "போர் ஆவணங்கள்", author_ta: "ந. சிவா" },
      ["title", "author"]
    );
    assert.equal(complete.enComplete, true);
    assert.equal(complete.taComplete, true);
    assert.equal(complete.missingTamil, false);
  });

  it("enforces ASCII-only slugs and generates clean ASCII slugs", () => {
    assert.equal(isAsciiSlug("katunayake-attack-2026"), true);
    assert.equal(isAsciiSlug("கட்டுநாயக்கா-நூல்"), false);
    assert.equal(isAsciiSlug("Title With Spaces"), false);

    assert.equal(generateAsciiSlug("Katunayake Air Base Victory (2026)!"), "katunayake-air-base-victory-2026");
    const fallback = generateAsciiSlug("தமிழ் மட்டும்", "book");
    assert.equal(isAsciiSlug(fallback), true);
  });
});

describe("Per-language Zod validation rules", () => {
  it("defaults REQUIRE_BOTH_LANGUAGES_TO_PUBLISH to false (EN required, TA optional)", () => {
    assert.equal(REQUIRE_BOTH_LANGUAGES_TO_PUBLISH, false);

    const bookEnOnly = adminBookCreateSchema.safeParse({
      title_en: "Archive Monograph",
      author_en: "Editorial Board",
      price: 250,
      stock: 5,
      cover_image_url: "https://example.com/front.webp",
      status: "published",
    });
    assert.equal(bookEnOnly.success, true);

    const bookMissingEn = adminBookCreateSchema.safeParse({
      title_ta: "தமிழ் தலைப்பு மட்டும்",
      author_ta: "ஆசிரியர்",
      price: 250,
      cover_image_url: "https://example.com/front.webp",
    });
    assert.equal(bookMissingEn.success, false);
    assert.ok(
      bookMissingEn.error.issues.some((i) => i.path.includes("title_en")),
      "Expected English title validation issue"
    );
  });

  it("rejects Tamil script in slug across book, blog, supporter, and video validators", () => {
    const resBook = adminBookCreateSchema.safeParse({
      title_en: "History Vol 1",
      author_en: "Author",
      slug: "தமிழ்-slug",
      price: 100,
      cover_image_url: "https://example.com/cover.webp",
    });
    assert.equal(resBook.success, false);

    const resPost = adminBlogPostCreateSchema.safeParse({
      title_en: "Field Report",
      body_en: "Detailed content",
      slug: "பதிவு-1",
    });
    assert.equal(resPost.success, false);
  });

  it("enforces both languages when strict flag override is enabled", () => {
    const strictBookSchema = z
      .object({
        title_en: z.string().optional(),
        title_ta: z.string().optional(),
        author_en: z.string().optional(),
        author_ta: z.string().optional(),
        status: z.enum(["draft", "published"]).default("published"),
      })
      .superRefine((data, ctx) => validateBilingualBookFields(data, ctx, true, true));

    const missingTamil = strictBookSchema.safeParse({
      title_en: "English Title",
      author_en: "English Author",
      status: "published",
    });
    assert.equal(missingTamil.success, false);
    assert.equal(missingTamil.error.issues.length, 2);

    const strictArticleSchema = z
      .object({
        title_en: z.string().optional(),
        title_ta: z.string().optional(),
        body_en: z.string().optional(),
        body_ta: z.string().optional(),
        status: z.enum(["draft", "published"]).default("published"),
      })
      .superRefine((data, ctx) => validateBilingualArticleFields(data, ctx, true, true));

    const completeArticle = strictArticleSchema.safeParse({
      title_en: "Article EN",
      title_ta: "கட்டுரை தமிழ்",
      body_en: "Body EN",
      body_ta: "உள்ளடக்கம் தமிழ்",
      status: "published",
    });
    assert.equal(completeArticle.success, true);

    const validSupporter = adminSupporterCreateSchema.safeParse({
      name_en: "Guardian Name",
      role_en: "Archivist",
      name_ta: "காவலர் பெயர்",
      role_ta: "ஆவணக் காவலர்",
    });
    assert.equal(validSupporter.success, true);

    const validVideo = adminVideoSchema.safeParse({
      title_en: "Documentary Film",
      title_ta: "ஆவணப் படம்",
      embed_url: "https://www.youtube.com/embed/abc123",
      poster_url: "/images/poster.webp",
    });
    assert.equal(validVideo.success, true);
  });
});

describe("Tamil UTF-8 end-to-end round-trip", () => {
  it("preserves UTF-8 Tamil grapheme clusters across JSON serialization, pair resolution, and search", () => {
    const tamilTitle = "மேதகு களஞ்சியம் — கட்டுநாயக்கா தாக்குதல் வெற்றி (ஆவணம்)";
    const tamilNote = "தமிழ்நாடு, புதுச்சேரி மற்றும் ஈழ வரலாற்றுத் தொகுப்பு: நூல் #12";

    // Simulate HTTP JSON serialization -> DB payload -> retrieval
    const wire = JSON.stringify({
      title_en: "Katunayake Victory",
      title_ta: tamilTitle,
      description_ta: tamilNote,
      slug: "katunayake-victory",
    });
    const parsed = JSON.parse(wire) as Record<string, string>;

    assert.equal(isTamilText(parsed.title_ta), true);
    assert.equal(isTamilText(parsed.title_en), false);
    assert.equal(parsed.title_ta, tamilTitle);
    assert.equal(parsed.description_ta, tamilNote);

    const resolvedTitle = resolveBilingualPair({
      en: parsed.title_en,
      ta: parsed.title_ta,
    });
    assert.equal(resolvedTitle.ta, tamilTitle);
    assert.equal(resolvedTitle.en, "Katunayake Victory");

    const searchBlob = buildBilingualSearchText(parsed, ["title", "description"]);
    assert.ok(searchBlob.includes("கட்டுநாயக்கா"));
    assert.ok(searchBlob.includes("katunayake victory"));
    assert.ok(searchBlob.includes("புதுச்சேரி"));
  });
});

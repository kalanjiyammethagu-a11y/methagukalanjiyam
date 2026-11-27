import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateERPBinStock,
  extractBookIdFromERPItemCode,
} from "../../src/lib/erp/erp-client.ts";
import {
  pickSuggestedArticles,
  resolveArticleExcerpt,
  resolveArticleCategoryPair,
} from "../../src/lib/blog-utils.ts";
import {
  DEFAULT_MANAGED_BLOG_CATEGORIES,
  normalizeManagedBlogCategories,
  toArticleCategoryOptions,
} from "../../src/lib/blog-categories.ts";
import {
  DISPLAY_PHONE,
  DISPLAY_WHATSAPP_LABEL_TA,
  WHATSAPP_NUMBER,
  buildWhatsAppDirectUrl,
} from "../../src/lib/whatsapp.ts";
import { fetchActiveAnnouncements, DEFAULT_ANNOUNCEMENTS } from "../../src/lib/announcements.ts";

test("ERP stock helpers extract BK UUID item codes and aggregate Bin warehouse stock safely", () => {
  assert.equal(
    extractBookIdFromERPItemCode("BK-123E4567-E89B-12D3-A456-426614174000"),
    "123e4567-e89b-12d3-a456-426614174000"
  );
  assert.equal(extractBookIdFromERPItemCode("CUSTOM-SKU"), null);

  const aggregated = aggregateERPBinStock([
    { item_code: "BK-abc", warehouse: "Stores - MK", actual_qty: 12 },
    { item_code: "bk-abc", warehouse: "Dispatch - MK", actual_qty: 8.7 },
    { item_code: "ITEM-2", warehouse: "Stores - MK", actual_qty: -3 },
  ]);

  assert.equal(aggregated.get("BK-ABC"), 20);
  assert.equal(aggregated.get("ITEM-2"), 0);
});

test("Blog keep-reading recommender excludes current slug and prioritizes matching category then date", () => {
  const articles = [
    { slug: "current", categoryEn: "Biography", categoryTa: "வாழ்க்கை வரலாறு", publishedAt: "2026-11-28" },
    { slug: "older-other", categoryEn: "Historical Record", categoryTa: "வரலாற்று ஆவணம்", publishedAt: "2026-11-29" },
    { slug: "same-cat-1", categoryEn: "Biography", categoryTa: "வாழ்க்கை வரலாறு", publishedAt: "2026-10-10" },
    { slug: "same-cat-2", categoryEn: "Biography", categoryTa: "வாழ்க்கை வரலாறு", publishedAt: "2026-11-01" },
    { slug: "newer-other", categoryEn: "Personal Memoir", categoryTa: "நினைவுக் குறிப்பு", publishedAt: "2026-11-20" },
  ];

  const suggested = pickSuggestedArticles(articles, "current", "Biography", "வாழ்க்கை வரலாறு", 3);
  assert.deepEqual(
    suggested.map((s) => s.slug),
    ["same-cat-2", "same-cat-1", "older-other"]
  );
  assert.ok(!suggested.some((s) => s.slug === "current"));
});

test("Blog excerpt fallback strips HTML and generates concise preview when excerpt is empty", () => {
  assert.equal(
    resolveArticleExcerpt("", "<h2>தலைப்பு</h2><p>முதல்   பத்தி  விவரம்.</p>"),
    "தலைப்பு முதல் பத்தி விவரம்."
  );
  assert.equal(resolveArticleExcerpt("Custom excerpt", "<p>Body text</p>"), "Custom excerpt");
});

test("Blog categories normalization preserves custom editable EN/TA categories cleanly", () => {
  const normalized = normalizeManagedBlogCategories([
    {
      id: "blog-cat-speeches",
      slug: "speeches",
      name_en: "Speeches & Talks",
      name_ta: "சொற்பொழிவுகள்",
      sort_order: 2,
      is_active: true,
    },
    {
      id: "blog-cat-hidden",
      slug: "internal-notes",
      name_en: "Internal Notes",
      name_ta: "உள் குறிப்புகள்",
      sort_order: 1,
      is_active: false,
    },
  ]);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0]?.slug, "internal-notes");

  const activeFilterOptions = toArticleCategoryOptions(normalized);
  assert.equal(activeFilterOptions.length, 1);
  assert.equal(activeFilterOptions[0]?.slug, "speeches");
  assert.ok(activeFilterOptions[0]?.aliases.includes("சொற்பொழிவுகள்"));

  const customPair = resolveArticleCategoryPair("Speeches & Talks", "சொற்பொழிவுகள்");
  assert.equal(customPair.en, "Speeches & Talks");
  assert.equal(customPair.ta, "சொற்பொழிவுகள்");
  assert.ok(DEFAULT_MANAGED_BLOG_CATEGORIES.length >= 6);
});

test("WhatsApp contact helpers use standardized 6384654946 number", () => {
  assert.equal(WHATSAPP_NUMBER, "916384654946");
  assert.equal(DISPLAY_PHONE, "+91 63846 54946");
  assert.equal(DISPLAY_WHATSAPP_LABEL_TA, "WhatsApp எண் : 6384654946");
  assert.equal(buildWhatsAppDirectUrl(), "https://wa.me/916384654946");
});

test("fetchActiveAnnouncements gracefully falls back cleanly to site_settings and defaults", async () => {
  const mockSupabaseMissingTable = {
    from(table: string) {
      if (table === "announcements") {
        return {
          select() { return this; },
          eq() { return this; },
          order() { return this; },
          then(resolve: any) {
            resolve({ data: null, error: { code: "42P01", message: "missing" } });
          },
        };
      }
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle() {
          return Promise.resolve({
            data: {
              value: [
                {
                  id: "ann-1",
                  date_label_ta: "10 நவம்பர் 2026",
                  date_label_en: "10 Nov 2026",
                  title_ta: "சிறப்பு அறிவிப்பு",
                  title_en: "Special Notice",
                  desc_ta: "விவரம்",
                  desc_en: "Details",
                  sort_order: 1,
                  is_active: true,
                },
              ],
            },
          });
        },
      };
    },
  };

  const loaded = await fetchActiveAnnouncements(mockSupabaseMissingTable);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0]?.titleEn, "Special Notice");

  const defaultLoaded = await fetchActiveAnnouncements(null);
  assert.equal(defaultLoaded.length, DEFAULT_ANNOUNCEMENTS.length);
});

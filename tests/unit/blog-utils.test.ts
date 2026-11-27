import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatArticleBodyHtml,
  matchesArticleCategory,
  mergeBlogPostsAndLegacyBlogs,
  normalizeLegacyBlogRow,
  resolveArticleCategoryPair,
  resolveBlogCoverUrl,
} from "../../src/lib/blog-utils.ts";

describe("Blog & Article Utilities", () => {
  it("extracts body text from legacy blogs rows storing content.body or content.html", () => {
    const bodyRow = normalizeLegacyBlogRow({
      id: "1",
      slug: "g",
      title: "கொளத்தூர் மணி",
      is_published: true,
      content: { body: "முதல் பத்தி\n\nஇரண்டாம் பத்தி" },
      cover_image: "https://example.supabase.co/storage/v1/object/public/blog/pic.jpg",
    });

    assert.equal(bodyRow.body, "முதல் பத்தி\n\nஇரண்டாம் பத்தி");
    assert.equal(bodyRow.status, "published");
    assert.equal(
      bodyRow.cover_image_url,
      "https://example.supabase.co/storage/v1/object/public/blog/pic.jpg"
    );

    const htmlRow = normalizeLegacyBlogRow({
      id: "2",
      slug: "legacy-html",
      title: "Legacy",
      is_published: true,
      content: { html: "<h2>Heading</h2><p>Paragraph</p>" },
    });
    assert.equal(htmlRow.body, "<h2>Heading</h2><p>Paragraph</p>");
  });

  it("formats plain-text Tamil paragraphs into structured HTML while keeping existing rich HTML intact", () => {
    const plain = "கொளத்தூர் மணி அறிமுகம்.\n\nவாழ்க்கைக் குறிப்பு\n1948-ஆம் ஆண்டு பிறந்தார்.";
    const formatted = formatArticleBodyHtml(plain);
    assert.ok(formatted.includes("<p>கொளத்தூர் மணி அறிமுகம்.</p>"));
    assert.ok(formatted.includes("<h2>வாழ்க்கைக் குறிப்பு</h2>"));
    assert.ok(formatted.includes("<p>1948-ஆம் ஆண்டு பிறந்தார்.</p>"));

    const richHtml = "<h2>Title</h2><p>Body <script>alert(1)</script>safe</p>";
    const cleanRich = formatArticleBodyHtml(richHtml);
    assert.ok(cleanRich.includes("<h2>Title</h2>"));
    assert.ok(!cleanRich.includes("<script>"));
    assert.ok(cleanRich.includes("safe"));
  });

  it("rewrites deleted /images/blogs/ static paths to Supabase storage URLs or safe fallback", () => {
    const resolved = resolveBlogCoverUrl("/images/blogs/thalapathi-vinayagam-banner.webp");
    assert.ok(
      resolved.includes("thalapathi-vinayagam-banner.webp") ||
        resolved === "/images/books/book-placeholder.webp"
    );
    assert.equal(
      resolveBlogCoverUrl("https://cdn.example.com/photo.jpg"),
      "https://cdn.example.com/photo.jpg"
    );
  });

  it("merges modern blog_posts with legacy blogs by slug newest-first without dropping legacy-only articles", () => {
    const merged = mergeBlogPostsAndLegacyBlogs(
      [
        {
          id: "modern-1",
          slug: "eelam-liberation",
          title: "Modern",
          created_at: "2026-11-24T13:07:08Z",
        },
      ],
      [
        {
          id: "legacy-dup",
          slug: "eelam-liberation",
          title: "Legacy Dup",
          content: { html: "<p>Old</p>" },
          created_at: "2026-11-24T13:38:02Z",
        },
        {
          id: "legacy-only",
          slug: "g",
          title: "கொளத்தூர் மணி",
          is_published: true,
          content: { body: "Tamil body" },
          created_at: "2026-11-27T00:57:29Z",
        },
      ]
    );

    assert.equal(merged.length, 2);
    assert.equal(merged[0]!.slug, "g");
    assert.equal(merged[0]!.body, "Tamil body");
    assert.equal(merged[1]!.title, "Modern");
  });

  it("matches bilingual article categories accurately across slug and labels", () => {
    const pair = resolveArticleCategoryPair("Personal Memoir", "");
    assert.equal(pair.en, "Personal Memoir");
    assert.equal(pair.ta, "நினைவுக் குறிப்பு");

    assert.equal(
      matchesArticleCategory({ categoryEn: "Historical Record", categoryTa: "வரலாற்று ஆவணம்" }, "history"),
      true
    );
    assert.equal(
      matchesArticleCategory({ categoryEn: "Historical Record", categoryTa: "வரலாற்று ஆவணம்" }, "memoir"),
      false
    );
  });
});

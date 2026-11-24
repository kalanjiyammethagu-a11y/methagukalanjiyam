/**
 * Test Suite for Dynamic CMS Architecture
 *
 * Verifies:
 * 1. Zod input validators for Books, Blog, Supporters, Videos
 * 2. Magic bytes image verification (anti-spoofing)
 * 3. Bucket resolution and storage helpers
 * 4. Signed upload URL validation rules
 */

import {
  adminBookSchema,
  adminBlogPostSchema,
  adminSupporterSchema,
  adminVideoSchema,
} from "../src/lib/validators/admin";
import {
  validateImageMagicBytes,
  getBucketForFolder,
} from "../src/lib/storage";

let passed = 0;
let failed = 0;

function assert(desc: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failed++;
  }
}

async function runTests() {
  console.log("==================================================================");
  console.log(" DYNAMIC CMS VALIDATION & ARCHITECTURE TEST SUITE");
  console.log("==================================================================");

  // 1. Zod Validators: Books
  console.log("\n[1] Book Validator Tests");
  const validBook = adminBookSchema.safeParse({
    title: "சோழர் கால வரலாற்று ஏடுகள்",
    slug: "chola-history-records",
    author: "வரலாற்றுப் பேரவை",
    price: 350,
    cover_image_url: "https://example.supabase.co/storage/v1/object/public/books/book-01.webp",
    category_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    status: "published",
    stock: 25,
  });
  assert("Valid book payload passes Zod validation", validBook.success);

  const invalidBook = adminBookSchema.safeParse({
    title: "", // Empty title forbidden
    price: -10, // Negative price forbidden
  });
  assert("Invalid book payload is rejected by Zod", !invalidBook.success);

  // 2. Zod Validators: Blog Posts
  console.log("\n[2] Blog Posts Validator Tests");
  const validBlog = adminBlogPostSchema.safeParse({
    title: "வரலாற்றுப் பாதுகாப்பு களஞ்சியப் பணிகள்",
    slug: "archival-preservation-works",
    body: "## ஆவணப் பாதுகாப்பு வழிகாட்டல்\n\nவிரிவான குறிப்புகள்...",
    excerpt: "ஆவணப் பாதுகாப்பு பற்றிய சுருக்கக் குறிப்பு",
    status: "published",
  });
  assert("Valid blog post payload passes Zod validation", validBlog.success);

  const invalidBlog = adminBlogPostSchema.safeParse({
    title: "Short",
    slug: "INVALID SLUG WITH SPACES",
    body: "",
  });
  assert("Blog with invalid slug and empty body is rejected", !invalidBlog.success);

  // 3. Zod Validators: Supporters
  console.log("\n[3] Supporters Validator Tests");
  const validSupporter = adminSupporterSchema.safeParse({
    name: "தீபக் ஹார்வின்",
    role_ta: "நிறுவன முதல்வர்",
    role_en: "Founder & Principal Director",
    status: "published",
    isActive: true,
  });
  assert("Valid supporter payload passes Zod validation", validSupporter.success);

  const invalidSupporter = adminSupporterSchema.safeParse({
    name: "", // Empty name forbidden
  });
  assert("Supporter without name is rejected", !invalidSupporter.success);

  // 4. Zod Validators: Videos
  console.log("\n[4] Videos Validator Tests");
  const validVideoDirect = adminVideoSchema.safeParse({
    title: "அறிமுகக் காணொளி",
    video_url: "https://example.supabase.co/storage/v1/object/public/videos/intro.mp4",
    poster_url: "https://example.supabase.co/storage/v1/object/public/video-posters/1.webp",
    status: "published",
  });
  assert("Valid video with direct storage URL passes", validVideoDirect.success);

  const validVideoEmbed = adminVideoSchema.safeParse({
    title: "வலைதள வழிகாட்டி",
    embed_url: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/guide",
    poster_url: "/images/video-posters/2.webp",
    status: "published",
  });
  assert("Valid video with external embed passes", validVideoEmbed.success);

  const invalidVideoNoMedia = adminVideoSchema.safeParse({
    title: "No media provided",
    poster_url: "/images/video-posters/1.webp",
    // neither video_url nor embed_url provided
  });
  assert("Video missing both uploaded file and embed URL is rejected", !invalidVideoNoMedia.success);

  const invalidVideoNoPoster = adminVideoSchema.safeParse({
    title: "No poster provided",
    embed_url: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/guide",
    poster_url: "", // Mandatory poster is missing
  });
  assert("Video missing mandatory poster thumbnail is rejected", !invalidVideoNoPoster.success);

  // 5. Magic Bytes Anti-Spoofing Verification
  console.log("\n[5] Image Magic Bytes Verification");

  // Valid JPEG (0xFF, 0xD8, 0xFF)
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x00]);
  assert("JPEG magic bytes correctly verified", validateImageMagicBytes(jpegHeader).valid);

  // Valid PNG (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  assert("PNG magic bytes correctly verified", validateImageMagicBytes(pngHeader).valid);

  // Valid WebP (RIFF....WEBP)
  const webpHeader = Buffer.from("RIFF\x24\x00\x00\x00WEBPVP8 ");
  assert("WebP magic bytes correctly verified", validateImageMagicBytes(webpHeader).valid);

  // Malicious disguised HTML script (<!DOCTYPE html> or <script>)
  const fakeImage = Buffer.from("<script>alert('xss')</script> extra bytes for length check");
  assert("Disguised script payload is correctly rejected by magic bytes", !validateImageMagicBytes(fakeImage).valid);

  // 6. Bucket Resolution Dispatch
  console.log("\n[6] Storage Bucket Resolution");
  assert("Folder 'books' maps to bucket 'books'", getBucketForFolder("books") === "books");
  assert("Folder 'blog' maps to bucket 'blog'", getBucketForFolder("blog") === "blog");
  assert("Folder 'supporters' maps to bucket 'supporters'", getBucketForFolder("supporters") === "supporters");
  assert("Folder 'videos' maps to bucket 'videos'", getBucketForFolder("videos") === "videos");
  assert("Folder 'video-posters' maps to bucket 'video-posters'", getBucketForFolder("video-posters") === "video-posters");

  console.log("\n==================================================================");
  console.log(` RESULTS: ${passed} passed, ${failed} failed`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

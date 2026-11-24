import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { detailedArticles } from "../src/data/articles";

loadEnvConfig(process.cwd());

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BASE_STORAGE_URL = `${supabaseUrl}/storage/v1/object/public`;

async function main() {
  console.log("==================================================================");
  console.log(" SEEDING & LINKING BLOGS TABLE WITH SUPABASE STORAGE ASSETS");
  console.log("==================================================================");

  const blogImageMap: Record<string, string> = {
    "eelam-liberation": "thalapathi-vinayagam-banner.webp",
    "movement-structure": "saanthi-nesakaram-banner.webp",
    "remembrance-memory": "deelipan-hero.webp",
    "archives-overview": "kanden-kanden-banner.webp",
    "publishing-mission": "prabakaran-dad-banner.webp",
  };

  for (const [slug, article] of Object.entries(detailedArticles)) {
    const filename = blogImageMap[slug] || "thalapathi-vinayagam-banner.webp";
    const fullUrl = `${BASE_STORAGE_URL}/blog/${filename}`;

    const payload = {
      title: article.titleTa,
      slug: article.slug,
      excerpt: article.subtitleTa,
      content: { html: article.htmlContentTa },
      cover_image: fullUrl,
      is_published: true,
      published_at: new Date(article.publishedAt).toISOString(),
      reading_time_mins: article.readingTimeMinutes,
      meta_title: article.titleEn,
      meta_description: article.subtitleEn,
      post_type: "article",
    };

    const { error } = await supabase
      .from("blogs")
      .upsert(payload, { onConflict: "slug" });

    if (error) {
      console.error(`  [Error] Blog '${slug}':`, error.message);
    } else {
      console.log(`  ✓ Blog '${slug}' -> ${fullUrl}`);
    }
  }

  console.log("Done linking blogs!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

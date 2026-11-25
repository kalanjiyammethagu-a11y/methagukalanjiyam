import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Fallback .env.local reader
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BASE_STORAGE_URL = `${supabaseUrl}/storage/v1/object/public`;

async function main() {
  console.log("==================================================================");
  console.log(" LINKING POSTGRES ROWS TO LIVE SUPABASE STORAGE ASSETS");
  console.log("==================================================================");

  // 1. LINK BOOKS (19 visually verified outside/front covers; methagu-kalanjiyam-aavanam flagged for manual cover)
  console.log("\n1. Linking Books...");
  const bookMappings: Record<string, string> = {
    "katunayake-attack-victory": "book-20.webp",
    "nenjuram": "book-16.webp",
    "dhisai-thavara-kanai": "book-13.webp",
    "niraiyaa-peruveli": "book-12.webp",
    "uyiranai": "book-15.webp",
    "amudhundha-vaaygal": "book-14.webp",
    "arivaran-pottu-amman": "book-17.webp",
    "peraattralon-kumaran": "book-18.webp",
    "purananooru-veeran": "book-07.webp",
    "kanden-kanden": "book-03.webp",
    "varalaru-enathu-vazhikaatti": "book-10.webp",
    "thileepanudan-12-naatkal": "book-02.webp",
    "varalatru-thalaivan": "book-06.webp",
    "tamileelam-viduthalai": "book-04.webp",
    "thozhar-tamilarasan": "book-05.webp",
    "makkal-thunaiyodu": "book-09.webp",
    "maamanithar-velupillai": "book-01.webp",
    "tamilar-padai-saadhanai": "book-11.webp",
    "thileepam": "book-19.webp",
  };

  for (const [slug, filename] of Object.entries(bookMappings)) {
    const fullUrl = `${BASE_STORAGE_URL}/books/${filename}`;
    const { error } = await supabase
      .from("books")
      .update({
        cover_image_path: filename,
        cover_image_url: fullUrl,
        cover_front: fullUrl,
        status: "published",
        is_active: true,
      })
      .eq("slug", slug);

    if (error) {
      console.error(`  [Error] Book '${slug}':`, error.message);
    } else {
      console.log(`  ✓ Book '${slug}' -> ${filename}`);
    }
  }

  // 2. LINK BLOG POSTS
  console.log("\n2. Linking Blog Posts...");
  const blogMappings: Record<string, string> = {
    "eelam-liberation": "thalapathi-vinayagam-banner.webp",
    "movement-structure": "saanthi-nesakaram-banner.webp",
    "remembrance-memory": "deelipan-hero.webp",
    "archives-overview": "kanden-kanden-banner.webp",
    "publishing-mission": "prabakaran-dad-banner.webp",
  };

  for (const [slug, filename] of Object.entries(blogMappings)) {
    const fullUrl = `${BASE_STORAGE_URL}/blog/${filename}`;
    const { error } = await supabase
      .from("blog_posts")
      .update({
        cover_image_path: filename,
        cover_image_url: fullUrl,
        status: "published",
      })
      .eq("slug", slug);

    if (error) {
      console.error(`  [Error] Blog post '${slug}':`, error.message);
    } else {
      console.log(`  ✓ Blog post '${slug}' -> ${filename}`);
    }
  }

  // 3. LINK SUPPORTERS
  console.log("\n3. Linking Supporters...");
  // Remove test rows if present
  await supabase.from("supporters").delete().eq("name", "Kavitha Raman");

  const supporterMappings: Array<{ match: string; filename: string }> = [
    { match: "Harvin", filename: "harvin.webp" },
    { match: "Subi", filename: "subi.webp" },
    { match: "Pacha", filename: "pachamuthu.webp" },
    { match: "Ranjith", filename: "ranjith.webp" },
    { match: "Madhan", filename: "selva.webp" },
    { match: "Tamil", filename: "suriya.webp" },
    { match: "Muthu", filename: "muniswaran.webp" },
    { match: "Jega", filename: "deelip.webp" },
    { match: "Aravind", filename: "ajay.webp" },
  ];

  for (const { match, filename } of supporterMappings) {
    const fullUrl = `${BASE_STORAGE_URL}/supporters/${filename}`;
    const { error } = await supabase
      .from("supporters")
      .update({
        logo_or_photo_path: filename,
        logo_or_photo_url: fullUrl,
        avatar_url: fullUrl,
        status: "published",
        is_active: true,
      })
      .ilike("name", `%${match}%`);

    if (error) {
      console.error(`  [Error] Supporter matching '${match}':`, error.message);
    } else {
      console.log(`  ✓ Supporter matching '${match}' -> ${filename}`);
    }
  }

  // 4. LINK VIDEOS
  console.log("\n4. Linking Videos...");
  for (let i = 1; i <= 23; i++) {
    const filename = `${i}.webp`;
    const fullUrl = `${BASE_STORAGE_URL}/video-posters/${filename}`;
    const { error } = await supabase
      .from("videos")
      .update({
        poster_path: filename,
        poster_url: fullUrl,
        status: "published",
        is_active: true,
      })
      .or(`slug.eq.video-${i},sort_order.eq.${i}`);

    if (error) {
      console.error(`  [Error] Video ${i}:`, error.message);
    } else {
      console.log(`  ✓ Video ${i} -> ${filename}`);
    }
  }

  console.log("\n==================================================================");
  console.log(" ALL DATABASE ROWS SUCCESSFULLY LINKED TO SUPABASE STORAGE!");
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});

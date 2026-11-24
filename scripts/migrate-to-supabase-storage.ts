/**
 * One-Time Migration Script: Migrate Static Assets to Supabase Storage
 *
 * Scans `/public/images/{books,blogs,supporters,video-posters}` and uploads
 * image assets to their designated Supabase Storage buckets, updating
 * corresponding Postgres database rows with `storage_path` and `public_url`.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase-storage.ts --dry-run
 *   npx tsx scripts/migrate-to-supabase-storage.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

// Automatically load .env.local, .env, and environment configurations
loadEnvConfig(process.cwd());

// Supplementary manual fallback parser for .env.local
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

const isDryRun = process.argv.includes("--dry-run");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("==================================================================");
console.log(" METHAGU KALANJIYAM — SUPABASE STORAGE ASSET MIGRATOR");
console.log(` Mode: ${isDryRun ? "DRY-RUN (Simulating actions)" : "LIVE EXECUTION"}`);
console.log("==================================================================");

if (!supabaseUrl || !serviceKey) {
  if (isDryRun) {
    console.log("[Info] Credentials not present in current env. Running dry-run simulation using mock endpoints.");
  } else {
    console.error("[Error] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live migration.");
    console.error("       Please ensure .env.local contains these variables.");
    process.exit(1);
  }
}

const supabase = (!isDryRun && supabaseUrl && serviceKey)
  ? createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

interface MigrationTarget {
  bucket: string;
  sourceDir: string;
  table: string;
  pathColumn: string;
  urlColumn: string;
  matchField: string;
}

const targets: MigrationTarget[] = [
  {
    bucket: "books",
    sourceDir: path.join(process.cwd(), "public", "images", "books"),
    table: "books",
    pathColumn: "cover_image_path",
    urlColumn: "cover_image_url",
    matchField: "cover_front",
  },
  {
    bucket: "blog",
    sourceDir: path.join(process.cwd(), "public", "images", "blogs"),
    table: "blog_posts",
    pathColumn: "cover_image_path",
    urlColumn: "cover_image_url",
    matchField: "cover_image",
  },
  {
    bucket: "supporters",
    sourceDir: path.join(process.cwd(), "public", "images", "supporters"),
    table: "supporters",
    pathColumn: "logo_or_photo_path",
    urlColumn: "logo_or_photo_url",
    matchField: "avatar_url",
  },
  {
    bucket: "video-posters",
    sourceDir: path.join(process.cwd(), "public", "images", "video-posters"),
    table: "videos",
    pathColumn: "poster_path",
    urlColumn: "poster_url",
    matchField: "poster_url",
  },
];

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

async function runMigration() {
  let totalScanned = 0;
  let totalUploaded = 0;
  let totalUpdated = 0;

  // In live mode, verify bucket availability
  if (!isDryRun && supabase) {
    console.log("Checking Supabase connection and storage buckets...");
    try {
      const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
      if (bucketsErr) {
        console.warn(`[Warning] Could not list buckets: ${bucketsErr.message}`);
      } else {
        const bucketNames = new Set(buckets.map((b) => b.name));
        for (const target of targets) {
          if (!bucketNames.has(target.bucket)) {
            console.log(`[Info] Bucket '${target.bucket}' not found. Attempting to create...`);
            const { error: createErr } = await supabase.storage.createBucket(target.bucket, {
              public: true,
            });
            if (createErr) {
              console.warn(
                `  [Notice] Could not auto-create bucket '${target.bucket}': ${createErr.message}.` +
                ` Please apply 'supabase/migrations/016_storage_buckets_and_policies.sql' if required.`
              );
            } else {
              console.log(`  ✓ Bucket '${target.bucket}' created successfully.`);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Warning] Connection check notice: ${err.message || err}`);
    }
  }

  for (const target of targets) {
    console.log(`\n▶ Processing target: Bucket '${target.bucket}' from ${path.relative(process.cwd(), target.sourceDir)}`);

    if (!fs.existsSync(target.sourceDir)) {
      console.log(`  [Skip] Directory does not exist: ${target.sourceDir}`);
      continue;
    }

    const files = fs.readdirSync(target.sourceDir).filter((f) => {
      const fullPath = path.join(target.sourceDir, f);
      return fs.statSync(fullPath).isFile() && !f.startsWith(".");
    });

    console.log(`  Found ${files.length} asset(s) to process.`);

    for (const filename of files) {
      totalScanned++;
      const filePath = path.join(target.sourceDir, filename);
      const mimeType = getMimeType(filePath);
      const storagePath = `${filename}`;
      const mockOrRealUrl = supabaseUrl
        ? `${supabaseUrl}/storage/v1/object/public/${target.bucket}/${storagePath}`
        : `https://example.supabase.co/storage/v1/object/public/${target.bucket}/${storagePath}`;

      if (isDryRun) {
        console.log(`  [DRY-RUN] Would upload '${filename}' (${mimeType}) -> bucket '${target.bucket}'`);
        console.log(`  [DRY-RUN] Would update '${target.table}' row: ${target.pathColumn}='${storagePath}', ${target.urlColumn}='${mockOrRealUrl}'`);
        totalUploaded++;
        totalUpdated++;
        continue;
      }

      if (!supabase) continue;

      try {
        const fileBytes = fs.readFileSync(filePath);

        // Upload to bucket (upsert: true so rerunning does not fail)
        const { error: uploadErr } = await supabase.storage
          .from(target.bucket)
          .upload(storagePath, fileBytes, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadErr) {
          console.warn(`  [Warn] Failed to upload ${filename} to ${target.bucket}: ${uploadErr.message}`);
          continue;
        }

        totalUploaded++;

        const { data: publicUrlData } = supabase.storage
          .from(target.bucket)
          .getPublicUrl(storagePath);

        const finalUrl = publicUrlData.publicUrl;

        // Update corresponding DB row
        const baseNameNoExt = path.parse(filename).name;
        const { error: dbErr } = await supabase
          .from(target.table)
          .update({
            [target.pathColumn]: storagePath,
            [target.urlColumn]: finalUrl,
          } as any)
          .or(
            `${target.pathColumn}.eq.${storagePath},${target.matchField}.ilike.%${filename}%,${target.matchField}.ilike.%${baseNameNoExt}%`
          );

        if (dbErr) {
          console.warn(`  [Notice] DB update notice for ${filename} on ${target.table}: ${dbErr.message}`);
        } else {
          totalUpdated++;
          console.log(`  ✓ Synced '${filename}' -> ${target.bucket}/${storagePath}`);
        }
      } catch (err: any) {
        console.error(`  [Error] Exception during ${filename} sync:`, err.message || err);
      }
    }
  }

  console.log("\n==================================================================");
  console.log(" MIGRATION SUMMARY");
  console.log(` Total Files Scanned : ${totalScanned}`);
  console.log(` Total Uploaded      : ${totalUploaded}`);
  console.log(` Total DB Rows Linked: ${totalUpdated}`);
  console.log(" Status              : COMPLETE");
  console.log("==================================================================");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

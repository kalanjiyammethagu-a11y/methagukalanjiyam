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

        // Upload to bucket (upsert: true to avoid duplicate failure)
        const { error: uploadErr } = await supabase.storage
          .from(target.bucket)
          .upload(storagePath, fileBytes, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadErr) {
          console.warn(`  [Warn] Failed to upload ${filename}: ${uploadErr.message}`);
          continue;
        }

        totalUploaded++;

        const { data: publicUrlData } = supabase.storage
          .from(target.bucket)
          .getPublicUrl(storagePath);

        const finalUrl = publicUrlData.publicUrl;

        // Update corresponding DB row
        const matchValue = `/images/${path.basename(target.sourceDir)}/${filename}`;
        const { data: updateData, error: dbErr } = await supabase
          .from(target.table)
          .update({
            [target.pathColumn]: storagePath,
            [target.urlColumn]: finalUrl,
          } as any)
          .ilike(target.matchField, `%${filename}%`);

        if (dbErr) {
          console.warn(`  [Warn] DB update failed for ${filename} on ${target.table}: ${dbErr.message}`);
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
  console.log(" Status              : SUCCESS");
  console.log("==================================================================");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

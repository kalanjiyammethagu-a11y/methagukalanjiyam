import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB (Supabase Pro plan limit; Free tier is 50 MB)
export const SUPABASE_FREE_TIER_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB

export type CmsBucket = "books" | "blog" | "supporters" | "videos" | "video-posters";

export interface MagicByteValidationResult {
  valid: boolean;
  mime?: string;
  extension?: string;
  error?: string;
}

/**
 * Validates file magic bytes directly from buffer.
 * Rejects disguised or spoofed file payloads regardless of extension or client-reported MIME.
 */
export function validateImageMagicBytes(buffer: Buffer): MagicByteValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "File buffer is too small or empty." };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mime: "image/jpeg", extension: "jpg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mime: "image/png", extension: "png" };
  }

  // 3. WebP: RIFF .... WEBP
  // Bytes 0-3: 'RIFF' (0x52 0x49 0x46 0x46), Bytes 8-11: 'WEBP' (0x57 0x45 0x42 0x50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, mime: "image/webp", extension: "webp" };
  }

  // 4. AVIF: Bytes 4-11 contains 'ftypavif' or 'ftypavis'
  if (
    buffer[4] === 0x66 && // f
    buffer[5] === 0x74 && // t
    buffer[6] === 0x79 && // y
    buffer[7] === 0x70    // p
  ) {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis" || brand === "mif1") {
      return { valid: true, mime: "image/avif", extension: "avif" };
    }
  }

  // 5. GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { valid: true, mime: "image/gif", extension: "gif" };
  }

  return {
    valid: false,
    error: "Invalid file signature. File contents do not match allowed image formats (JPEG, PNG, WebP, AVIF, GIF).",
  };
}

/**
 * Maps raw folder string from admin form to canonical Supabase Storage bucket.
 */
export function getBucketForFolder(folder: string): CmsBucket {
  switch (folder.toLowerCase()) {
    case "books":
    case "book":
      return "books";
    case "blog":
    case "blogs":
    case "articles":
    case "article":
      return "blog";
    case "supporters":
    case "supporter":
    case "members":
      return "supporters";
    case "video-posters":
    case "videoposters":
    case "posters":
      return "video-posters";
    case "videos":
    case "video":
      return "videos";
    default:
      return "books";
  }
}

/**
 * Resolves full public URL from a bucket and object path.
 */
export function getPublicStorageUrl(bucket: CmsBucket, path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const adminSupabase = createAdminClient();
  const { data } = adminSupabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads an image asset to Supabase Storage with strict verification.
 * 1. Checks size against MAX_IMAGE_SIZE_BYTES
 * 2. Validates magic bytes
 * 3. Generates cryptographic UUID filename
 * 4. Uploads to bucket via server admin client
 * 5. Returns storage path and public URL
 */
export async function uploadAdminImage(
  buffer: Buffer,
  bucket: CmsBucket
): Promise<{ path: string; url: string }> {
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`File size ${(buffer.length / (1024 * 1024)).toFixed(2)} MB exceeds maximum limit of 5 MB.`);
  }

  const magicCheck = validateImageMagicBytes(buffer);
  if (!magicCheck.valid || !magicCheck.mime || !magicCheck.extension) {
    throw new Error(magicCheck.error || "File validation failed.");
  }

  const filename = `${crypto.randomUUID()}.${magicCheck.extension}`;
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType: magicCheck.mime,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload error: ${error.message}`);
  }

  const url = getPublicStorageUrl(bucket, filename);
  return { path: filename, url };
}

/**
 * Deletes a storage object by bucket and path.
 */
export async function deleteAdminAsset(bucket: CmsBucket, path: string): Promise<void> {
  if (!path || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/images/")) {
    // If it's a static image or full external URL without relative path, nothing to remove from bucket
    return;
  }
  try {
    const adminSupabase = createAdminClient();
    await adminSupabase.storage.from(bucket).remove([path]);
  } catch (err) {
    console.warn(`[deleteAdminAsset] Failed to remove ${path} from ${bucket}:`, err);
  }
}

/**
 * Generates a signed direct-to-storage upload URL for videos to bypass Cloudflare/Next.js body size limits.
 */
export async function generateSignedVideoUploadUrl(
  declaredMime: string,
  declaredSizeBytes: number
): Promise<{
  signedUrl: string;
  path: string;
  token: string;
  publicUrl: string;
  warning?: string;
}> {
  const allowedMimes = ["video/mp4", "video/webm", "video/quicktime"];
  if (!allowedMimes.includes(declaredMime.toLowerCase())) {
    throw new Error(`Invalid video format '${declaredMime}'. Allowed types: MP4, WebM, QuickTime (MOV).`);
  }

  if (declaredSizeBytes > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(
      `Video size ${(declaredSizeBytes / (1024 * 1024)).toFixed(2)} MB exceeds maximum allowed limit of 500 MB.`
    );
  }

  let warning: string | undefined;
  if (declaredSizeBytes > SUPABASE_FREE_TIER_LIMIT_BYTES) {
    warning = `Video is ${(declaredSizeBytes / (1024 * 1024)).toFixed(1)} MB. Upload requires a Supabase Pro plan (Free tier caps uploads at 50 MB).`;
  }

  const ext = declaredMime === "video/webm" ? "webm" : declaredMime === "video/quicktime" ? "mov" : "mp4";
  const path = `video-${crypto.randomUUID()}.${ext}`;

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase.storage
    .from("videos")
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to generate signed upload URL: ${error?.message || "Unknown error"}`);
  }

  const publicUrl = getPublicStorageUrl("videos", path);

  return {
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
    publicUrl,
    warning,
  };
}

/**
 * Verifies that a storage object actually exists in a bucket before saving a database row.
 */
export async function verifyStorageObjectExists(bucket: CmsBucket, path: string): Promise<boolean> {
  if (!path) return false;
  try {
    const adminSupabase = createAdminClient();
    // Path could be a filename in the root of the bucket or folder/filename
    const folder = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
    const filename = path.includes("/") ? path.substring(path.lastIndexOf("/") + 1) : path;

    const { data, error } = await adminSupabase.storage.from(bucket).list(folder, {
      limit: 100,
      search: filename,
    });

    if (error || !data) return false;
    return data.some((item) => item.name === filename);
  } catch (err) {
    console.warn(`[verifyStorageObjectExists] Error checking ${path} in ${bucket}:`, err);
    return false;
  }
}

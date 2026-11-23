import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminImageFolderSchema } from "@/lib/validators/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = formData.get("folder") as string | null;
    const folderParsed = adminImageFolderSchema.safeParse(rawFolder || "books");
    if (!folderParsed.success) {
      return NextResponse.json(
        { error: "Invalid target folder. Allowed: books, blogs, articles, supporters, members." },
        { status: 400 }
      );
    }
    const folder = folderParsed.data;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    // Safe target folder: "blogs", "books", or "supporters"
    let safeFolder = "books";
    let prefix = "book-upload";
    if (folder === "blogs" || folder === "articles") {
      safeFolder = "blogs";
      prefix = "article-upload";
    } else if (folder === "supporters" || folder === "members") {
      safeFolder = "supporters";
      prefix = "supporter-upload";
    }

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const safeName = `${prefix}-${Date.now()}${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Try writing to local public/images directory (VPS / Dev environments)
    try {
      const uploadDir = path.join(process.cwd(), "public", "images", safeFolder);
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, safeName), buffer);
      const publicPath = `/images/${safeFolder}/${safeName}`;
      return NextResponse.json({ path: publicPath }, { status: 200 });
    } catch (fsErr) {
      console.warn("Local filesystem write unavailable, attempting Supabase Storage fallback:", fsErr);
    }

    // 2. Try Supabase Storage bucket ("covers" or "public-assets")
    try {
      const adminSupabase = createAdminClient();
      const storagePath = `${safeFolder}/${safeName}`;
      const { data: uploadData, error: uploadErr } = await adminSupabase.storage
        .from("covers")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: { publicUrl } } = adminSupabase.storage
          .from("covers")
          .getPublicUrl(storagePath);
        return NextResponse.json({ path: publicUrl }, { status: 200 });
      }
    } catch (storageErr) {
      console.warn("Supabase storage bucket upload skipped:", storageErr);
    }

    // 3. Resilient fallback for serverless read-only filesystems without storage configured
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ path: dataUrl }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/admin/upload-image error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

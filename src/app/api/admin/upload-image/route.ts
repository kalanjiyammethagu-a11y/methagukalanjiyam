import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-service";
import { adminImageFolderSchema } from "@/lib/validators/admin";
import { getBucketForFolder, uploadAdminImage, MAX_IMAGE_SIZE_BYTES } from "@/lib/storage";

export const dynamic = "force-dynamic";

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
        {
          error:
            "Invalid target folder. Allowed: books, blog, blogs, articles, supporters, members, video-posters, videos.",
        },
        { status: 400 }
      );
    }
    const folder = folderParsed.data;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const bucket = getBucketForFolder(folder);

    // Upload to Supabase Storage with strict magic-bytes verification and UUID filename
    const result = await uploadAdminImage(buffer, bucket);

    return NextResponse.json(
      {
        path: result.path,
        url: result.url,
        // Backwards compatibility for components expecting `path` as the displayable URL
        publicUrl: result.url,
        bucket,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/upload-image error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload image to storage" },
      { status: 400 }
    );
  }
}

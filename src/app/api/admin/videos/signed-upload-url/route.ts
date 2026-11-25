import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-service";
import { generateSignedVideoUploadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const mimeType = body.mimeType || body.contentType;
    const rawSize = body.sizeBytes ?? body.fileSize;
    const sizeBytes = typeof rawSize === "number" ? rawSize : Number(rawSize);

    if (!mimeType || typeof mimeType !== "string") {
      return NextResponse.json({ error: "Missing or invalid mimeType" }, { status: 400 });
    }

    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json({ error: "Missing or invalid sizeBytes" }, { status: 400 });
    }

    const result = await generateSignedVideoUploadUrl(mimeType, sizeBytes);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/admin/videos/signed-upload-url error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate signed video upload URL" },
      { status: 400 }
    );
  }
}

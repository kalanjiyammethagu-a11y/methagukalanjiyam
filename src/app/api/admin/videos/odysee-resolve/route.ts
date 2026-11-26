import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-service";
import { generateAsciiSlug } from "@/lib/i18n";
import { MAX_IMAGE_SIZE_BYTES, uploadAdminImage } from "@/lib/storage";
import {
  normalizeVideoEmbedUrl,
  odyseeUrlToLbryUri,
} from "@/lib/video-utils";

export const dynamic = "force-dynamic";

function isAllowedRemoteThumbnailUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "https:") {
      const host = parsed.hostname.toLowerCase();
      // Block private/loopback literals for HTTPS fetches
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "0.0.0.0" ||
        host.startsWith("10.") ||
        host.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        host.endsWith(".local")
      ) {
        return false;
      }
      return true;
    }
    // Allow explicit local mock HTTP endpoint in automated tests/dev
    if (
      parsed.protocol === "http:" &&
      process.env.ODYSEE_RESOLVE_API_URL &&
      (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: { url?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const rawUrl = (body?.url || "").trim();
    const lbryUri = odyseeUrlToLbryUri(rawUrl);
    if (!lbryUri) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid Odysee watch URL, Odysee embed URL, or lbry:// URI.",
        },
        { status: 400 }
      );
    }

    const embedUrl = normalizeVideoEmbedUrl(rawUrl);
    const resolveEndpoint =
      process.env.ODYSEE_RESOLVE_API_URL ||
      "https://api.na-backend.odysee.com/api/v1/proxy";

    let title = "";
    let description = "";
    let durationSeconds = 0;
    let claimName = "";
    let externalThumb = "";

    try {
      const rpcRes = await fetch(resolveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "resolve",
          params: { urls: [lbryUri] },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (rpcRes.ok) {
        const rpcJson = await rpcRes.json();
        const resultMap = rpcJson?.result || {};
        const claim = resultMap[lbryUri] || Object.values(resultMap)[0];
        if (claim && !claim.error && claim.value) {
          title = String(claim.value.title || "").trim();
          description = String(claim.value.description || "").trim();
          externalThumb = String(claim.value.thumbnail?.url || "").trim();
          durationSeconds = Number(claim.value.video?.duration || 0) || 0;
          claimName = String(claim.name || "").trim();
        }
      }
    } catch (rpcErr: any) {
      console.warn(
        "[POST /api/admin/videos/odysee-resolve] Metadata resolve warning:",
        rpcErr?.message
      );
    }

    let posterUrl = "";
    let posterPath = "";
    if (externalThumb && isAllowedRemoteThumbnailUrl(externalThumb)) {
      try {
        const imgRes = await fetch(externalThumb, {
          signal: AbortSignal.timeout(8000),
        });
        if (imgRes.ok) {
          const contentLen = Number(imgRes.headers.get("content-length") || 0);
          if (!contentLen || contentLen <= MAX_IMAGE_SIZE_BYTES) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            if (buf.length > 0 && buf.length <= MAX_IMAGE_SIZE_BYTES) {
              const uploaded = await uploadAdminImage(buf, "video-posters");
              posterUrl = uploaded.url;
              posterPath = uploaded.path;
            }
          }
        }
      } catch (thumbErr: any) {
        console.warn(
          "[POST /api/admin/videos/odysee-resolve] Thumbnail cache warning:",
          thumbErr?.message
        );
      }
    }

    const fallbackName = lbryUri.split("/").pop()?.replace(/#.*/, "") || "odysee-video";
    const slug = generateAsciiSlug(claimName || title || fallbackName, "video");

    return NextResponse.json({
      embedUrl,
      lbryUri,
      title,
      description,
      durationSeconds,
      slug,
      posterUrl,
      posterPath,
      externalThumbnailUrl: externalThumb || undefined,
    });
  } catch (err: any) {
    console.error("POST /api/admin/videos/odysee-resolve error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

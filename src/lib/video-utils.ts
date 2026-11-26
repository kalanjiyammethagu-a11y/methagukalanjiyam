import { BOOK_PLACEHOLDER_IMAGE, getSupabaseStorageUrl } from "@/lib/book-images";

export interface VideoCategoryOption {
  slug: string;
  labelTa: string;
  labelEn: string;
}

export const VIDEO_CATEGORY_OPTIONS: VideoCategoryOption[] = [
  { slug: "book-showcase", labelTa: "புத்தகக் காணொளி", labelEn: "Book Showcase" },
  { slug: "memorial", labelTa: "நினைவேந்தல்", labelEn: "Memorials" },
  { slug: "history", labelTa: "வரலாற்று ஆவணம்", labelEn: "History" },
  { slug: "tactical", labelTa: "கள ஆவணம்", labelEn: "Tactical" },
  { slug: "overview", labelTa: "அறிமுகம்", labelEn: "Overview" },
];

const EMBED_HOST_RE = /(^|\.)(odysee\.com|youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com)$/i;
const DIRECT_VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i;

export function isEmbedPlatformUrl(rawUrl?: string | null): boolean {
  const clean = (rawUrl || "").trim();
  if (!clean) return false;
  if (/^lbry:\/\//i.test(clean)) return true;
  if (/\/(\$|\x24|%24)\/embed\//i.test(clean)) return true;
  try {
    const parsed = new URL(clean);
    return EMBED_HOST_RE.test(parsed.hostname);
  } catch {
    return false;
  }
}

function lbryPathToWebPath(lbryPath: string): string {
  return lbryPath
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.replace(/#([a-zA-Z0-9]+)/g, ":$1"))
    .join("/");
}

/**
 * Extracts a canonical `lbry://` claim URI from any Odysee watch URL, `/$/embed/` URL, or `lbry://` string.
 */
export function odyseeUrlToLbryUri(rawInput?: string | null): string | null {
  const clean = (rawInput || "").trim();
  if (!clean) return null;

  if (/^lbry:\/\//i.test(clean)) {
    const rest = clean.slice("lbry://".length).replace(/^\/+/, "");
    return rest ? `lbry://${rest}` : null;
  }

  try {
    const u = new URL(clean);
    const host = u.hostname.toLowerCase();
    if (host !== "odysee.com" && !host.endsWith(".odysee.com")) {
      return null;
    }
    let decodedPath = decodeURIComponent(u.pathname);
    decodedPath = decodedPath.replace(/^\/+/, "");
    if (decodedPath.startsWith("$/embed/")) {
      decodedPath = decodedPath.slice("$/embed/".length);
    } else if (decodedPath.startsWith("$/download/")) {
      decodedPath = decodedPath.slice("$/download/".length);
    }
    decodedPath = decodedPath.replace(/^\/+/, "");
    if (!decodedPath || decodedPath.startsWith("$")) return null;
    const lbrySegments = decodedPath
      .split("/")
      .filter(Boolean)
      .map((seg) => seg.replace(/:([a-zA-Z0-9]+)$/, "#$1"));
    return lbrySegments.length > 0 ? `lbry://${lbrySegments.join("/")}` : null;
  } catch {
    return null;
  }
}

export function isDirectVideoFileUrl(rawUrl?: string | null, videoPath?: string | null): boolean {
  if (videoPath && videoPath.trim()) return true;
  const clean = (rawUrl || "").trim();
  if (!clean || isEmbedPlatformUrl(clean)) return false;
  if (clean.includes("/storage/v1/object/")) return true;
  return DIRECT_VIDEO_EXT_RE.test(clean);
}

/**
 * Normalizes external video links (Odysee watch URLs, YouTube, Vimeo) into embeddable iframe URLs.
 * Preserves existing Odysee `/$/embed/` (or `/%24/embed/`) URLs and query parameters without corrupting encodings.
 */
export function normalizeVideoEmbedUrl(rawInput?: string | null): string {
  const clean = (rawInput || "").trim();
  if (!clean) return "";

  if (/^lbry:\/\//i.test(clean)) {
    const rest = clean.slice("lbry://".length).replace(/^\/+/, "");
    if (!rest) return "";
    return `https://odysee.com/$/embed/${lbryPathToWebPath(rest)}`;
  }

  try {
    const u = new URL(clean);
    const host = u.hostname.toLowerCase();

    // Odysee watch URL -> Odysee /$/embed/ URL
    if (host === "odysee.com" || host.endsWith(".odysee.com")) {
      const lowerPath = u.pathname.toLowerCase();
      if (lowerPath.startsWith("/$/embed/") || lowerPath.startsWith("/%24/embed/")) {
        return clean;
      }
      if (lowerPath.startsWith("/$/download/")) {
        const rest = u.pathname.slice("/$/download/".length);
        u.pathname = `/$/embed/${rest}`;
        return u.toString();
      }
      const trimmedPath = u.pathname.replace(/^\/+/, "");
      if (trimmedPath) {
        u.pathname = `/$/embed/${trimmedPath}`;
        return u.toString();
      }
      return clean;
    }

    // YouTube short URLs or standard watch URLs -> privacy-enhanced embed URL
    if (host === "youtu.be") {
      const videoId = u.pathname.replace(/^\/+/, "").split("/")[0];
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
    }
    if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
      if (u.pathname.startsWith("/embed/")) return clean;
      const v = u.searchParams.get("v");
      if (v) {
        return `https://www.youtube-nocookie.com/embed/${v}`;
      }
      if (u.pathname.startsWith("/shorts/")) {
        const shortId = u.pathname.slice("/shorts/".length).split("/")[0];
        if (shortId) {
          return `https://www.youtube-nocookie.com/embed/${shortId}`;
        }
      }
    }

    // Vimeo watch URL -> player.vimeo.com embed URL
    if (host === "vimeo.com" || host === "www.vimeo.com") {
      const id = u.pathname.replace(/^\/+/, "").split("/")[0];
      if (id && /^\d+$/.test(id)) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }

    return clean;
  } catch {
    return clean;
  }
}

export interface ResolvedVideoMedia {
  mode: "upload" | "embed";
  embedUrl: string;
  videoUrl?: string;
}

/**
 * Separates true direct video uploads from external embed URLs (Odysee/YouTube/Vimeo),
 * preventing HTML embed pages stored in legacy `video_url` columns from rendering inside <video>.
 */
export function resolveVideoMedia(input: {
  embed_url?: string | null;
  video_url?: string | null;
  video_path?: string | null;
}): ResolvedVideoMedia {
  const rawEmbed = (input.embed_url || "").trim();
  const rawVideoUrl = (input.video_url || "").trim();
  const rawVideoPath = (input.video_path || "").trim();

  // Direct upload only if an explicit storage path exists OR video_url points to a real media file (not an HTML embed site)
  if (rawVideoPath || isDirectVideoFileUrl(rawVideoUrl)) {
    const resolvedDirect =
      rawVideoUrl && !isEmbedPlatformUrl(rawVideoUrl)
        ? rawVideoUrl
        : rawVideoPath
        ? getSupabaseStorageUrl("videos", rawVideoPath)
        : rawEmbed;

    return {
      mode: "upload",
      videoUrl: resolvedDirect,
      embedUrl: resolvedDirect,
    };
  }

  const candidateEmbed = rawEmbed || rawVideoUrl;
  return {
    mode: "embed",
    embedUrl: normalizeVideoEmbedUrl(candidateEmbed),
    videoUrl: undefined,
  };
}

/**
 * Resolves a video poster thumbnail dynamically to Supabase Storage when legacy `/images/video-posters/...`
 * static paths are present in older DB seed rows.
 */
export function resolveVideoPosterUrl(input: {
  poster_url?: string | null;
  poster_path?: string | null;
}): string {
  const rawUrl = (input.poster_url || "").trim();
  const rawPath = (input.poster_path || "").trim();

  if (rawUrl.startsWith("/images/video-posters/")) {
    const filename = rawUrl.slice("/images/video-posters/".length);
    if (filename) {
      return getSupabaseStorageUrl("video-posters", filename);
    }
  }

  if (rawPath && (!rawUrl || rawUrl.startsWith("/images/video-posters/"))) {
    return getSupabaseStorageUrl("video-posters", rawPath);
  }

  if (rawUrl) {
    return rawUrl.startsWith("http") || rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  }

  const defaultStoragePoster = getSupabaseStorageUrl("video-posters", "1.webp");
  return defaultStoragePoster === BOOK_PLACEHOLDER_IMAGE ? BOOK_PLACEHOLDER_IMAGE : defaultStoragePoster;
}

/**
 * Builds autoplay query parameters appropriate for the embed host (Odysee uses `autoplay=true`,
 * YouTube/Vimeo use `autoplay=1`).
 */
export function getAutoplayEmbedUrl(url: string): string {
  const normalized = normalizeVideoEmbedUrl(url);
  if (!normalized) return "";
  try {
    const u = new URL(normalized);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtube") || host.includes("vimeo")) {
      u.searchParams.set("autoplay", "1");
      u.searchParams.set("playsinline", "1");
    } else {
      u.searchParams.set("autoplay", "true");
      u.searchParams.set("muted", "0");
      u.searchParams.set("playsinline", "1");
    }
    return u.toString();
  } catch {
    const sep = normalized.includes("?") ? "&" : "?";
    return `${normalized}${sep}autoplay=true&muted=0&playsinline=1`;
  }
}

export function matchVideoCategorySlug(categoryEn?: string | null, categoryTa?: string | null): string {
  const en = (categoryEn || "").trim().toLowerCase();
  const ta = (categoryTa || "").trim().toLowerCase();
  for (const opt of VIDEO_CATEGORY_OPTIONS) {
    if (opt.labelTa.toLowerCase() === ta || opt.labelEn.toLowerCase() === en) {
      return opt.slug;
    }
  }
  if (en === "memorial") return "memorial";
  return "";
}

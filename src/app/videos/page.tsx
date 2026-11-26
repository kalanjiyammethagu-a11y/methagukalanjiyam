import * as React from "react";
import type { Metadata } from "next";
import { VideosCatalogClient } from "@/components/videos/VideosCatalogClient";
import type { VideoData } from "@/components/videos/VideoCard";
import { allVideos } from "@/data/videos";
import { safeJsonLdStringify } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import { resolveBilingualPair } from "@/lib/i18n";
import { resolveVideoMedia, resolveVideoPosterUrl } from "@/lib/video-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "காணொளி ஆவணங்கள் — Historical Video Documentaries & Archives | மேதகு களஞ்சியம்",
  description:
    "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், அரிய வரலாற்று ஆவணங்கள், புத்தக அறிமுகக் காட்சிகள் மற்றும் மாவீரர் நினைவேந்தல் ஒலி-ஒளிப் பேழைக் காப்பகம்.",
  alternates: {
    canonical: "https://methagukalanjiyam.in/videos",
  },
  openGraph: {
    title: "காணொளி ஆவணங்கள் — Historical Video Documentaries & Archives",
    description:
      "தமிழீழ விடுதலைப் போராட்ட வரலாற்று ஆவணக் காணொளிகள் மற்றும் புத்தக அறிமுகக் காட்சிகள்.",
    url: "https://methagukalanjiyam.in/videos",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/banner-video-archive.webp",
        width: 1200,
        height: 630,
        alt: "மேதகு களஞ்சியம் காணொளி ஆவணங்கள்",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "காணொளி ஆவணங்கள் — Historical Video Documentaries",
    description: "அரிய வரலாற்று ஆவணக் காணொளிகள் மற்றும் புத்தக முன்னோட்டங்கள்.",
    images: ["/images/brand/banner-video-archive.webp"],
  },
};

export default async function VideosPage() {
  let videosList: VideoData[] = allVideos;

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("videos") as any)
      .select("*")
      .eq("status", "published")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      videosList = data.map((row: any) => {
        const titlePair = resolveBilingualPair({ en: row.title_en, ta: row.title_ta, legacy: row.title });
        const descPair = resolveBilingualPair({ en: row.description_en, ta: row.description_ta, legacy: row.description });
        const media = resolveVideoMedia({
          embed_url: row.embed_url,
          video_url: row.video_url,
          video_path: row.video_path,
        });
        const staticMatch = allVideos.find(
          (sv) =>
            sv.embedUrl === media.embedUrl ||
            `video-${sv.id}` === row.slug
        );
        const catPair = resolveBilingualPair({
          en: row.category_en || staticMatch?.categoryEn,
          ta: row.category_ta || staticMatch?.categoryTa,
          legacy: staticMatch?.categoryEn || "History",
        });
        return {
          id: row.id,
          titleTa: titlePair.ta || titlePair.en || row.title,
          titleEn: titlePair.en || titlePair.ta || row.title,
          descriptionTa: descPair.ta || descPair.en || "",
          descriptionEn: descPair.en || descPair.ta || "",
          embedUrl: media.embedUrl,
          videoUrl: media.videoUrl,
          posterImage: resolveVideoPosterUrl({
            poster_url: row.poster_url,
            poster_path: row.poster_path,
          }),
          posterAltTa: row.poster_alt_ta || undefined,
          posterAltEn: row.poster_alt_en || undefined,
          categoryTa: catPair.ta || staticMatch?.categoryTa || "வரலாற்று ஆவணம்",
          categoryEn: catPair.en || staticMatch?.categoryEn || "History",
          duration: row.duration_seconds
            ? `${Math.floor(row.duration_seconds / 60)}:${(row.duration_seconds % 60).toString().padStart(2, "0")}`
            : staticMatch?.duration,
          publishedDate: row.created_at ? row.created_at.split("T")[0] : "2026",
        };
      });
    }
  } catch (err) {
    console.error("Failed to load videos from Supabase:", err);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://methagukalanjiyam.in/videos#collection",
        name: "காணொளி ஆவணங்கள் — Video Archives",
        url: "https://methagukalanjiyam.in/videos",
        description: "Rare Tamil historical documentaries, speeches, and literary book previews.",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://methagukalanjiyam.in/#website",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://methagukalanjiyam.in/videos#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "முகப்பு",
            item: "https://methagukalanjiyam.in",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "காணொளி ஆவணங்கள்",
            item: "https://methagukalanjiyam.in/videos",
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Historical Video Documentaries",
        itemListElement: videosList.slice(0, 10).map((v, i) => ({
          "@type": "VideoObject",
          position: i + 1,
          name: v.titleTa,
          description: v.descriptionTa,
          thumbnailUrl: v.posterImage.startsWith("http")
            ? v.posterImage
            : `https://methagukalanjiyam.in${v.posterImage.startsWith("/") ? v.posterImage : `/${v.posterImage}`}`,
          uploadDate: v.publishedDate || "2026-01-01",
          embedUrl: v.embedUrl,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
      <VideosCatalogClient initialVideos={videosList} />
    </>
  );
}

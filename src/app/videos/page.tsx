import * as React from "react";
import type { Metadata } from "next";
import { VideosCatalogClient } from "@/components/videos/VideosCatalogClient";
import { allVideos } from "@/data/videos";
import { safeJsonLdStringify } from "@/lib/sanitize";

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

export default function VideosPage() {
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
        itemListElement: allVideos.slice(0, 10).map((v, i) => ({
          "@type": "VideoObject",
          position: i + 1,
          name: v.titleTa,
          description: v.descriptionTa,
          thumbnailUrl: `https://methagukalanjiyam.in${v.posterImage}`,
          uploadDate: "2026-01-01",
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
      <VideosCatalogClient />
    </>
  );
}

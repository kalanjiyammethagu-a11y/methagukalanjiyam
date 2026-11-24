import * as React from "react";
import type { Metadata } from "next";
import { BlogCatalogClient } from "@/components/blog/BlogCatalogClient";
import { safeJsonLdStringify } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "செய்திகள் & ஆவணப் பதிவுகள் — Articles, News & Archival Records | மேதகு களஞ்சியம்",
  description:
    "தமிழீழ விடுதலைப் போராட்ட வரலாற்று ஆவணங்கள், நினைவுக் குறிப்புகள், கள ஆய்வுக் கட்டுரைகள் மற்றும் அதிகாரப்பூர்வ அறிவிப்புகள்.",
  alternates: {
    canonical: "https://methagukalanjiyam.in/blog",
  },
  openGraph: {
    title: "செய்திகள் & ஆவணப் பதிவுகள் — Articles & Archival Records",
    description:
      "தமிழீழ விடுதலைப் போராட்ட வரலாற்று ஆவணங்கள், நினைவுக் குறிப்புகள் மற்றும் வரலாற்று ஆய்வுக் கட்டுரைகள்.",
    url: "https://methagukalanjiyam.in/blog",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/banner-1200.webp",
        width: 1200,
        height: 675,
        alt: "மேதகு களஞ்சியம் கட்டுரைகள்",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "செய்திகள் & ஆவணப் பதிவுகள் — Articles & Archival Records",
    description: "தமிழீழ விடுதலைப் போராட்ட வரலாற்று ஆவணங்கள் மற்றும் ஆய்வுக் கட்டுரைகள்.",
    images: ["/images/brand/banner-1200.webp"],
  },
};

export default function BlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://methagukalanjiyam.in/blog#collection",
        name: "செய்திகள் & ஆவணப் பதிவுகள் — Articles & Archives",
        url: "https://methagukalanjiyam.in/blog",
        description: "Historical articles, memoirs, and national archives from Methagu Kalanjiyam.",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://methagukalanjiyam.in/#website",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://methagukalanjiyam.in/blog#breadcrumb",
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
            name: "செய்திகள் & பதிவுகள்",
            item: "https://methagukalanjiyam.in/blog",
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
      <BlogCatalogClient />
    </>
  );
}

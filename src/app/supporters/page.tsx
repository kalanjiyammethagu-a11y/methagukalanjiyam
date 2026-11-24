import * as React from "react";
import type { Metadata } from "next";
import { SupportersCatalogClient } from "@/components/supporters/SupportersCatalogClient";
import { safeJsonLdStringify } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "களஞ்சியத்தின் ஆதரவாளர்கள் — Guardians & Archival Custodians | மேதகு களஞ்சியம்",
  description:
    "மேதகு களஞ்சியத்தின் அரிய தமிழ் தேசிய ஆவணங்கள் மற்றும் வரலாற்று நூல்களைப் பாதுகாத்து விநியோகிக்கும் தோழர்கள் மற்றும் ஆதரவாளர்கள்.",
  alternates: {
    canonical: "https://methagukalanjiyam.in/supporters",
  },
  openGraph: {
    title: "களஞ்சியத்தின் ஆதரவாளர்கள் — Guardians & Archival Custodians",
    description:
      "மேதகு களஞ்சியத்தின் அரிய தமிழ் தேசிய ஆவணங்கள் மற்றும் வரலாற்று நூல்களைப் பாதுகாக்கும் குழுவினர்.",
    url: "https://methagukalanjiyam.in/supporters",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/banner-1200.webp",
        width: 1200,
        height: 675,
        alt: "மேதகு களஞ்சியம் ஆதரவாளர்கள்",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "களஞ்சியத்தின் ஆதரவாளர்கள் — Archival Custodians",
    description: "அரிய தமிழ் தேசிய ஆவணங்கள் மற்றும் வரலாற்று நூல்களைப் பாதுகாக்கும் தோழர்கள்.",
    images: ["/images/brand/banner-1200.webp"],
  },
};

export default function SupportersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://methagukalanjiyam.in/supporters#about",
        name: "களஞ்சியத்தின் ஆதரவாளர்கள் — Archival Custodians",
        url: "https://methagukalanjiyam.in/supporters",
        description: "Custodians and contributors to Methagu Kalanjiyam historical archives.",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://methagukalanjiyam.in/#website",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://methagukalanjiyam.in/supporters#breadcrumb",
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
            name: "ஆதரவாளர்கள்",
            item: "https://methagukalanjiyam.in/supporters",
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
      <SupportersCatalogClient />
    </>
  );
}

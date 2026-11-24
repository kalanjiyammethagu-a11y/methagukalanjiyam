import * as React from "react";
import type { Metadata } from "next";
import { CertificateClient } from "@/components/legal/CertificateClient";
import { safeJsonLdStringify } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "மத்திய அரசு MSME பதிவுச் சான்றிதழ் — Government of India Udyam Certificate | மேதகு களஞ்சியம்",
  description:
    "மேதகு களஞ்சியம் நிறுவனத்தின் இந்திய அரசு குறு, சிறு மற்றும் நடுத்தர தொழில் அமைச்சக (Ministry of MSME) உத்யம் பதிவுச் சான்றிதழ் விவரங்கள் (UDYAM-TN-18-0101323).",
  alternates: {
    canonical: "https://methagukalanjiyam.in/certificate",
  },
  openGraph: {
    title: "மத்திய அரசு MSME பதிவுச் சான்றிதழ் — MSME Udyam Certificate",
    description:
      "இந்திய அரசு குறு, சிறு மற்றும் நடுத்தர தொழில் அமைச்சக (Ministry of MSME) உத்யம் பதிவுச் சான்றிதழ் விவரங்கள்.",
    url: "https://methagukalanjiyam.in/certificate",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/certificate-seal.webp",
        width: 848,
        height: 1200,
        alt: "மேதகு களஞ்சியம் உத்யம் பதிவுச் சான்றிதழ்",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "மத்திய அரசு MSME பதிவுச் சான்றிதழ் — MSME Certificate",
    description: "இந்திய அரசு MSME அமைச்சக உத்யம் பதிவுச் சான்றிதழ் விவரங்கள்.",
    images: ["/images/brand/certificate-seal.webp"],
  },
};

export default function CertificatePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://methagukalanjiyam.in/certificate#webpage",
        name: "மத்திய அரசு MSME உத்யம் பதிவுச் சான்றிதழ்",
        url: "https://methagukalanjiyam.in/certificate",
        description: "Official Ministry of MSME Udyam Registration Certificate for Methagu Kalanjiyam.",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://methagukalanjiyam.in/#website",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://methagukalanjiyam.in/certificate#breadcrumb",
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
            name: "பதிவுச் சான்றிதழ்",
            item: "https://methagukalanjiyam.in/certificate",
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
      <CertificateClient />
    </>
  );
}

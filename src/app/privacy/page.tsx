import * as React from "react";
import type { Metadata } from "next";
import { PrivacyClient } from "@/components/legal/PrivacyClient";
import { safeJsonLdStringify } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "தனியுரிமைக் கொள்கை — Privacy Policy & Data Protection | மேதகு களஞ்சியம்",
  description:
    "மேதகு களஞ்சியத்தின் வாசகர் தனியுரிமை, தனிப்பட்ட விபரப் பாதுகாப்பு மற்றும் கட்டணப் பரிவர்த்தனை பாதுகாப்பு விதிகள்.",
  alternates: {
    canonical: "https://methagukalanjiyam.in/privacy",
  },
  openGraph: {
    title: "தனியுரிமைக் கொள்கை — Privacy Policy | மேதகு களஞ்சியம்",
    description: "வாசகர் தனியுரிமை மற்றும் தரவுப் பாதுகாப்பு கொள்கைகள்.",
    url: "https://methagukalanjiyam.in/privacy",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "தனியுரிமைக் கொள்கை — Privacy Policy",
    description: "மேதகு களஞ்சியம் வாசகர் தரவுப் பாதுகாப்பு கொள்கை.",
  },
};

export default function PrivacyPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://methagukalanjiyam.in/privacy#webpage",
        name: "தனியுரிமைக் கொள்கை — Privacy Policy",
        url: "https://methagukalanjiyam.in/privacy",
        description: "Privacy policy and customer data protection principles of Methagu Kalanjiyam.",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://methagukalanjiyam.in/#website",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://methagukalanjiyam.in/privacy#breadcrumb",
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
            name: "தனியுரிமைக் கொள்கை",
            item: "https://methagukalanjiyam.in/privacy",
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
      <PrivacyClient />
    </>
  );
}

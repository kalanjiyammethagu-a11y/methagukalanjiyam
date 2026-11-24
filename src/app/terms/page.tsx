import * as React from "react";
import type { Metadata } from "next";
import { TermsClient } from "@/components/legal/TermsClient";
import { safeJsonLdStringify } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "விதிமுறைகளும் நிபந்தனைகளும் — Terms & Delivery Conditions | மேதகு களஞ்சியம்",
  description:
    "மேதகு களஞ்சியம் புத்தக நிலையத்தின் சேவை விதிகள், இந்தியா போஸ்ட் விரைவு அஞ்சல் விநியோகம் மற்றும் நூல் மாற்றுக் கொள்கை.",
  alternates: {
    canonical: "https://methagukalanjiyam.in/terms",
  },
  openGraph: {
    title: "விதிமுறைகளும் நிபந்தனைகளும் — Terms & Delivery Conditions",
    description: "சேவை விதிகள், அஞ்சல் விநியோகம் மற்றும் நூல் மாற்றுக் கொள்கை.",
    url: "https://methagukalanjiyam.in/terms",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "விதிமுறைகளும் நிபந்தனைகளும் — Terms & Conditions",
    description: "மேதகு களஞ்சியம் புத்தக நிலையத்தின் சேவை விதிகள் மற்றும் அஞ்சல் கொள்கை.",
  },
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://methagukalanjiyam.in/terms#webpage",
        name: "விதிமுறைகளும் நிபந்தனைகளும் — Terms & Conditions",
        url: "https://methagukalanjiyam.in/terms",
        description: "Terms and conditions of service, shipping, and book delivery for Methagu Kalanjiyam.",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://methagukalanjiyam.in/#website",
          name: "மேதகு களஞ்சியம்",
          url: "https://methagukalanjiyam.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://methagukalanjiyam.in/terms#breadcrumb",
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
            name: "விதிமுறைகளும் நிபந்தனைகளும்",
            item: "https://methagukalanjiyam.in/terms",
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
      <TermsClient />
    </>
  );
}

import * as React from "react";
import type { Metadata } from "next";
import { SupportersCatalogClient } from "@/components/supporters/SupportersCatalogClient";
import type { SupporterData } from "@/components/supporters/SupporterCard";
import { safeJsonLdStringify } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import { resolveBilingualPair } from "@/lib/i18n";

export const dynamic = "force-dynamic";

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

export default async function SupportersPage() {
  let dbSupporters: SupporterData[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("supporters") as any)
      .select("*")
      .eq("status", "published")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      dbSupporters = data.map((row: any) => {
        const namePair = resolveBilingualPair({ en: row.name_en, ta: row.name_ta, legacy: row.name });
        const rolePair = resolveBilingualPair({
          en: row.role_en ?? row.description_en,
          ta: row.role_ta ?? row.description_ta,
          legacy: row.description,
        });
        return {
          id: row.id,
          nameTa: namePair.ta || namePair.en || row.name,
          nameEn: namePair.en || namePair.ta || row.name,
          roleTa: rolePair.ta || rolePair.en || "ஆவணப் பங்களிப்பாளர்",
          roleEn: rolePair.en || rolePair.ta || "Archival Contributor",
          image: row.logo_or_photo_url || row.avatar_url || "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/harvin.webp",
          photoAltTa: row.photo_alt_ta || row.avatar_alt_ta || undefined,
          photoAltEn: row.photo_alt_en || row.avatar_alt_en || undefined,
          instagramUrl: row.website_url || undefined,
          whatsappUrl: undefined,
        };
      });
    }
  } catch (err) {
    console.error("Failed to load supporters from Supabase:", err);
  }

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
      <SupportersCatalogClient initialSupporters={dbSupporters.length > 0 ? dbSupporters : undefined} />
    </>
  );
}

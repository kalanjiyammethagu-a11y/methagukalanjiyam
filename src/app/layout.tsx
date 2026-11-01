import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, Noto_Sans_Tamil, Noto_Serif_Tamil } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { LanguageProvider } from "@/context/LanguageContext";
import { SettingsModal } from "@/components/layout/SettingsModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerifTamil = Noto_Serif_Tamil({
  variable: "--font-noto-serif-tamil",
  subsets: ["tamil"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A6847",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "மேதகு களஞ்சியம் — Rare Tamil Literature & National Archives",
  description:
    "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம். அரிய வரலாற்று நூல்களை பாதுகாப்பாக ஆர்டர் செய்யுங்கள்.",
  metadataBase: new URL("https://methagukalanjiyam.in"),
  keywords: [
    "Tamil books",
    "Methagu Kalanjiyam",
    "Tamil history",
    "Eelam history",
    "rare Tamil books",
    "மேதகு களஞ்சியம்",
  ],
  openGraph: {
    title: "மேதகு களஞ்சியம் — Rare Tamil Literature",
    description: "அரிய தமிழ் வரலாற்று நூல்கள் & தேசிய ஆவணப் பெட்டகம்",
    url: "https://methagukalanjiyam.in",
    siteName: "Methagu Kalanjiyam",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/images/brand/banner-1200.webp",
        width: 1200,
        height: 675,
        alt: "மேதகு களஞ்சியம் பதாகை",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "மேதகு களஞ்சியம் — Rare Tamil Literature",
    description: "அரிய தமிழ் வரலாற்று நூல்கள் & தேசிய ஆவணப் பெட்டகம்",
    images: ["/images/brand/images/brand/banner-1200.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://methagukalanjiyam.in",
    languages: {
      "ta-IN": "https://methagukalanjiyam.in",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BookStore",
        "@id": "https://methagukalanjiyam.in/#bookstore",
        name: "மேதகு களஞ்சியம்",
        alternateName: "Methagu Kalanjiyam",
        url: "https://methagukalanjiyam.in",
        logo: "https://methagukalanjiyam.in/images/brand/images/brand/logo.webp",
        image: "https://methagukalanjiyam.in/images/brand/images/brand/banner-1200.webp",
        description: "Rare Tamil Literature & Historical National Archives Bookstore.",
        telephone: "+91-6384654946",
        address: {
          "@type": "PostalAddress",
          streetAddress: "South Street, Kanarpatti",
          addressLocality: "Tirunelveli",
          addressRegion: "Tamil Nadu",
          postalCode: "627201",
          addressCountry: "IN",
        },
        identifier: "UDYAM-TN-18-0101323",
        priceRange: "₹80 - ₹450",
        currenciesAccepted: "INR",
        paymentAccepted: "Cash on Delivery, UPI, WhatsApp Order",
      },
      {
        "@type": "WebSite",
        "@id": "https://methagukalanjiyam.in/#website",
        name: "மேதகு களஞ்சியம்",
        alternateName: "Methagu Kalanjiyam",
        url: "https://methagukalanjiyam.in",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://methagukalanjiyam.in/books?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang="ta"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${notoTamil.variable} ${notoSerifTamil.variable}`}
    >
      <head>
        {/* Dublin Core Archival Metadata (ISO 15836 Standard) */}
        <meta name="DC.title" content="மேதகு களஞ்சியம் — Rare Tamil Literature & National Archives" />
        <meta name="DC.creator" content="மேதகு களஞ்சியம் (Methagu Kalanjiyam)" />
        <meta name="DC.subject" content="Tamil History; Eelam Liberation; National Archives; Rare Tamil Books" />
        <meta name="DC.description" content="அரிய தமிழ் தேசிய வரலாற்று நூல்கள், கள ஆய்வுகள் மற்றும் விடுதலைப் போராட்ட ஆவணப் பெட்டகம்." />
        <meta name="DC.publisher" content="மேதகு களஞ்சியம்" />
        <meta name="DC.type" content="Collection" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.language" content="ta" />
        <meta name="DC.coverage" content="Tamil Eelam; Tamil Nadu; Global Tamil Diaspora" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-surface text-ink antialiased selection:bg-accent/15 selection:text-accent"
      >
        <LanguageProvider>
          {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.4.1) */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#0A6847] focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white font-tamil text-sm font-semibold"
          >
            முக்கிய உள்ளடக்கத்திற்குச் செல்க (Skip to main content)
          </a>

          <Header />
          <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
            {children}
          </main>
          <Footer />

          {/* Platform Settings Modal */}
          <SettingsModal />

          {/* Floating WhatsApp Action on Every Page */}
          <FloatingWhatsApp />
        </LanguageProvider>
      </body>
    </html>
  );
}

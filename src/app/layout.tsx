import type { Metadata } from "next";
import { Inter, Fraunces, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

export const metadata: Metadata = {
  title: "மெதகு களஞ்சியம் — Rare Tamil Literature & National Archives",
  description:
    "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம். அரிய வரலாற்று நூல்களை பாதுகாப்பாக ஆர்டர் செய்யுங்கள்.",
  metadataBase: new URL("https://methagukalanjiyam.in"),
  keywords: [
    "Tamil books",
    "Methagu Kalanjiyam",
    "Tamil history",
    "Eelam history",
    "rare Tamil books",
    "மெதகு களஞ்சியம்",
  ],
  openGraph: {
    title: "மெதகு களஞ்சியம் — Rare Tamil Literature",
    description: "அரிய தமிழ் வரலாற்று நூல்கள் & தேசிய ஆவணப் பெட்டகம்",
    url: "https://methagukalanjiyam.in",
    siteName: "Methagu Kalanjiyam",
    locale: "ta_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ta" className={`${inter.variable} ${fraunces.variable} ${notoTamil.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#111111] antialiased selection:bg-[#0A6847]/15 selection:text-[#0A6847]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

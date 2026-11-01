"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Compass,
  FileCheck2,
  HeartHandshake,
  Layers,
} from "lucide-react";
import {
  PostalSealIcon,
  ArchivalAudioReelIcon,
  ArchivalWaxSealIcon,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatINR } from "@/lib/utils";
import { HeroSlider } from "@/components/home/HeroSlider";
import { BookCard } from "@/components/books/BookCard";
import { useLanguage } from "@/context/LanguageContext";

import { allBooks, type BookItem } from "@/data/books";

const catalogBooks: BookItem[] = allBooks;

const categories = [
  {
    nameTa: "வரலாறு & ஆவணங்கள்",
    nameEn: "Historical Records & Treatises",
    slug: "history",
    countTa: "19 நூல்கள்",
    countEn: "19 Publications",
    descTa: "சரிபார்க்கப்பட்ட கள ஆய்வுகள், போர் வரலாற்று ஏடுகள் மற்றும் மூல ஆவணப் பதிவுகள்.",
    descEn: "Verified field investigations, strategic treatises, and original archival documentation.",
  },
  {
    nameTa: "போராட்ட நினைவுகள்",
    nameEn: "Memoirs & Battlefield Chronicles",
    slug: "memoirs",
    countTa: "15 நூல்கள்",
    countEn: "15 Publications",
    descTa: "களத்தில் நின்ற போராளிகள் மற்றும் மக்களின் நேரடி நினைவுக் குறிப்புகளின் பெட்டகம்.",
    descEn: "Firsthand accounts, personal diaries, and frontline memoirs from historical participants.",
  },
  {
    nameTa: "ஆவணத் தொகுப்புகள்",
    nameEn: "Archival Compilations",
    slug: "archives",
    countTa: "12 நூல்கள்",
    countEn: "12 Publications",
    descTa: "சாந்தி நேசக்கரம் உள்ளிட்ட அரிய பதிப்பகங்களின் உத்தியோகபூர்வ ஆவண நூல்கள்.",
    descEn: "Authorized compilations and rare publications produced by Saanthi Nesakaram and publishers.",
  },
  {
    nameTa: "தலைவர்கள் வரலாறு",
    nameEn: "Biographies & Leadership",
    slug: "biographies",
    countTa: "8 நூல்கள்",
    countEn: "8 Publications",
    descTa: "தேசியத் தலைவர் மற்றும் தளபதிகளின் சிந்தனைகள், கொள்கை உரைகள் மற்றும் வாழ்க்கை வரலாறு.",
    descEn: "Speeches, military philosophies, and detailed biographical studies of national leadership.",
  },
];

export default function HomePage() {
  const { locale } = useLanguage();
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const filteredBooks = React.useMemo(() => {
    if (selectedCategory === "all") return catalogBooks;
    return catalogBooks.filter((book) => book.categorySlug === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-16 sm:space-y-24 pb-24">
      
      {/* ============================================================
          1. SLIDE-BASED HERO CAROUSEL WITH REAL ARCHIVAL BANNERS
          ============================================================ */}
      <HeroSlider />

      {/* ============================================================
          2. ASYMMETRICAL EDITORIAL BENTO GRID (Complex Unique Layout)
          ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-black/8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] font-tamil-serif leading-snug">
              {locale === "ta" ? "களஞ்சியத் தனித்துவங்கள்" : "Curated Archival Pillars"}
            </h2>
            <p className="text-xs sm:text-sm text-[#444444] font-medium mt-1 font-tamil leading-relaxed">
              {locale === "ta"
                ? "சரிபார்க்கப்பட்ட அரிய ஆவணங்கள், நேரடிப் பதிப்பக விநியோகம் மற்றும் டிஜிட்டல் களஞ்சியம்."
                : "Authentic historical monographs, direct postal dispatch, and permanent digital preservation."}
            </p>
          </div>
          <Link
            href="/books"
            className="text-xs sm:text-sm font-bold text-[#0A6847] hover:underline flex items-center gap-1 font-tamil min-h-[44px]"
          >
            <span>{locale === "ta" ? "முழுத் தொகுப்பை அறிக" : "Explore Entire Archive"}</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          
          {/* Bento Tile 1: Primary Spotlight Book (Span 7) */}
          <GlassPanel
            interactive
            className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between group rounded-3xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-[#0A6847] uppercase font-tamil">
                  {locale === "ta" ? "முதன்மை ஆவண நூல்" : "Primary Archival Spotlight"}
                </span>
                <span className="text-xs tabular-nums font-semibold text-[#666666]">2001 PUBLICATION</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
                <div className="sm:col-span-5 flex justify-center">
                  <div className="relative aspect-[3/4] w-44 rounded-xl overflow-hidden bg-[#ECE8DF] border border-black/10 shadow-xl group-hover:scale-103 transition-transform duration-300">
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10 pointer-events-none" />
                    <Image
                      src="/images/books/book-20.webp"
                      alt="கட்டுநாயக்கா தாக்குதல் வெற்றி"
                      fill
                      sizes="180px"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-2.5 font-tamil">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#111111] leading-snug font-tamil-serif">
                    {locale === "ta" ? "கட்டுநாயக்கா தாக்குதல் வெற்றி" : "Katunayake Air Base Victory"}
                  </h3>
                  <p className="text-xs font-bold text-[#0A6847]">
                    {locale === "ta" ? "ஆசிரியர்: சாந்தி நேசக்கரம்" : "Author: Saanthi Nesakaram"}
                  </p>
                  <p className="text-xs text-[#444444] leading-relaxed font-medium">
                    {locale === "ta"
                      ? "ஈழ விடுதலைப் போராட்ட வரலாற்றில் சாந்தி நேசக்கரம் ஆவணப்படுத்திய அரிய வரலாற்றுத் தடம். நீண்டகால உழைப்பில் உருவான நேரடி ஆவணம்."
                      : "A meticulously verified firsthand record documenting one of the most decisive tactical breakthroughs in Tamil liberation history."}
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <Button href="/books/katunayake-attack-victory" size="sm" variant="primary">
                      {locale === "ta" ? "நூலை ஆர்டர் செய்க" : "Order Book (₹100)"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-black/8 flex items-center justify-between text-xs text-[#555555] font-tamil">
              <span>{locale === "ta" ? "நேரடிப் பதிப்பக அச்சுப் பதிப்பு" : "Original Press Edition"}</span>
              <span className="font-bold text-[#0A6847]">{locale === "ta" ? "கையிருப்பில் உள்ளது" : "In Stock"}</span>
            </div>
          </GlassPanel>

          {/* Bento Tile 2: Postal Tracking & Shipping Integrity (Span 5) */}
          <GlassPanel
            interactive
            className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between rounded-3xl group bg-[#FBF9F4]/90"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 flex items-center justify-center text-[#0A6847] shadow-2xs">
                <PostalSealIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#111111] font-tamil">
                {locale === "ta" ? "நேரடி தபால் & கண்காணிப்பு" : "Direct Dispatch & Live AWB"}
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed font-tamil font-medium">
                {locale === "ta"
                  ? "இந்தியா முழுவதும் India Post & ST Courier வழியாக பாதுகாப்பான தபால் சேவை. பார்சல் அனுப்பப்பட்டதும் SMS/WhatsApp வழியாக நேரடி டிராக்கிங் எண்."
                  : "Nationwide dispatch across India via India Post and ST Courier. Real-time AWB tracking numbers delivered straight to SMS/WhatsApp."}
              </p>
            </div>

            <div className="pt-5 border-t border-black/8 space-y-2">
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-tamil">
                <div className="p-2.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
                  <div className="text-[10px] text-zinc-500 font-semibold">{locale === "ta" ? "தமிழ்நாடு" : "Tamil Nadu"}</div>
                  <div className="font-extrabold text-[#0A6847]">₹60</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
                  <div className="text-[10px] text-zinc-500 font-semibold">{locale === "ta" ? "பிற மாநிலம்" : "Other States"}</div>
                  <div className="font-extrabold text-[#0A6847]">₹100</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
                  <div className="text-[10px] text-zinc-500 font-semibold">{locale === "ta" ? "வெளிநாடு" : "Diaspora"}</div>
                  <div className="font-extrabold text-amber-700">DHL / Post</div>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Bento Tile 3: Multimedia & Speech Archives (Span 5) */}
          <GlassPanel
            interactive
            className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between rounded-3xl group"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700 shadow-2xs">
                <ArchivalAudioReelIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#111111] font-tamil">
                {locale === "ta" ? "ஒலி & வீடியோ ஆவணங்கள்" : "Audio & Video Archives"}
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed font-tamil font-medium">
                {locale === "ta"
                  ? "வரலாற்றுப் பிரகடனங்கள், களத்து உரைகள் மற்றும் தேசிய ஆவணப் பதிவுகளின் பிரத்யேக ஆடியோ-வீடியோ காப்பகம்."
                  : "Access curated historical speeches, frontline video reels, and authenticated broadcast records from the national archive."}
              </p>
            </div>

            <div className="pt-6 border-t border-black/8">
              <Button href="/videos" size="sm" variant="glass" className="w-full justify-between font-tamil font-bold">
                <span>{locale === "ta" ? "ஆவண வீடியோக்களைக் காண்க" : "Browse Video Archives"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassPanel>

          {/* Bento Tile 4: Provenance Verification & Support (Span 7) */}
          <GlassPanel
            interactive
            className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between rounded-3xl group"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-700 shadow-2xs shrink-0">
                  <ArchivalWaxSealIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#111111] font-tamil">
                    {locale === "ta" ? "அழியாத தேசிய ஆவணப் பாதுகாப்பு" : "Permanent Archival Integrity"}
                  </h3>
                  <span className="text-xs text-[#0A6847] font-semibold">100% Verified Provenance</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#444444] leading-relaxed font-tamil font-medium">
                {locale === "ta"
                  ? "மேதகு களஞ்சியம் வணிக நோக்கற்ற ஒரு பண்பாட்டு ஆவணக் காப்பகம். அரிய நூல்கள் மீண்டும் அச்சேற்றப்பட்டு உலகத் தமிழர்களின் எதிர்கால சந்ததிக்காக டிஜிட்டல் முறையில் பாதுகாக்கப்படுகின்றன."
                  : "Methagu Kalanjiyam operates as a dedicated non-commercial cultural archive. Rare out-of-print books are cataloged and preserved for posterity and future generations."}
              </p>
            </div>

            <div className="pt-6 border-t border-black/8 flex flex-wrap items-center justify-between gap-3 text-xs font-tamil">
              <span className="text-[#555555]">
                {locale === "ta" ? "பதிவுச் சான்றிதழ் எண்: சரிபார்க்கப்பட்டது" : "Registration Certificate: Verified"}
              </span>
              <Button href="/certificate" size="sm" variant="outline" className="font-semibold text-xs">
                {locale === "ta" ? "சான்றிதழ் காண்க" : "View Certificate"}
              </Button>
            </div>
          </GlassPanel>

        </div>
      </section>

      {/* ============================================================
          3. HISTORICAL QUOTE BANNER (Dignified Archival Typography)
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center shadow-xs border border-black/8 relative">
          <blockquote className={locale === "ta" ? "font-tamil-serif text-lg sm:text-2xl text-[#111111] leading-relaxed" : "font-serif italic text-lg sm:text-2xl text-[#111111] leading-relaxed"}>
            {locale === "ta" ? (
              <>&ldquo;ஒரு விடுதலைப் போராளியின் சாவும் ஒரு சாதாரண மனிதனின் மரணமும் ஒன்றல்ல. அந்தச் சாவு சரித்திரத்தை உருவாக்குகிறது.&rdquo;</>
            ) : (
              <>&ldquo;The death of a liberation fighter and the demise of an ordinary man are never the same. That death authors living history.&rdquo;</>
            )}
          </blockquote>
          <cite className="block mt-5 text-xs sm:text-sm font-bold tracking-wider text-[#0A6847] uppercase font-tamil not-italic">
            {locale === "ta" ? "— தேசியத் தலைவர் மேதகு வே. பிரபாகரன்" : "— National Leader V. Prabhakaran"}
          </cite>
        </div>
      </section>

      {/* ============================================================
          4. INTERACTIVE FILTERABLE BOOK CATALOG (Tactile Physical Books)
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-4 border-b border-black/8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] font-tamil-serif leading-snug">
              {locale === "ta" ? "முக்கிய வரலாற்று நூற்பட்டியல்" : "Curated Archival Catalog"}
            </h2>
            <p className="text-xs sm:text-sm text-[#444444] font-medium mt-1 font-tamil leading-relaxed">
              {locale === "ta"
                ? "களப் பதிவுகள், வரலாற்று நூல்கள் மற்றும் தலைவர்களின் உரைத் தொகுப்புகள்."
                : "Authenticated monographs, tactical field records, and archival volumes available for order."}
            </p>
          </div>

          {/* Category Filter — Apple HIG Segmented Bar */}
          <div
            className="p-1 rounded-2xl bg-black/[0.04] backdrop-blur-md border border-black/[0.08] flex items-center gap-1 overflow-x-auto scrollbar-none shadow-2xs"
            role="tablist"
            aria-label={locale === "ta" ? "நூல் வகை வடிப்பான்கள்" : "Catalog category filters"}
          >
            {[
              { id: "all", labelTa: "அனைத்தும்", labelEn: "All Books" },
              { id: "history", labelTa: "வரலாறு", labelEn: "History" },
              { id: "memoirs", labelTa: "நினைவுகள்", labelEn: "Memoirs" },
              { id: "archives", labelTa: "ஆவணங்கள்", labelEn: "Archives" },
              { id: "biographies", labelTa: "தலைவர்கள்", labelEn: "Leadership" },
            ].map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer font-tamil active:scale-[0.98] ${
                    isActive
                      ? "bg-[#0A6847] text-white shadow-xs font-bold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                  }`}
                >
                  {locale === "ta" ? tab.labelTa : tab.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Proportional Archival Book Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
          {filteredBooks.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              locale={locale}
              variant={index === 0 && selectedCategory === "all" ? "featured" : "default"}
            />
          ))}
        </div>
      </section>

      {/* ============================================================
          5. CURATED ARCHIVAL TAXONOMY DIRECTORY (Enterprise Museum Craft)
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="pb-3 border-b border-black/8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] font-tamil-serif leading-snug">
            {locale === "ta" ? "பிரிவு வாரியாக வாசியுங்கள்" : "Archival Taxonomy & Collections"}
          </h2>
          <p className="text-xs sm:text-sm text-[#444444] font-medium mt-1 font-tamil leading-relaxed">
            {locale === "ta"
              ? "தலைப்புகள், கள ஆவண வகைகள் மற்றும் வரலாற்று காலகட்டம் வாரியாக ஒழுங்கமைக்கப்பட்ட ஆவணத் தொகுப்பு."
              : "Structured taxonomy organized across historical eras, military memoirs, and authenticated volumes."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, idx) => (
            <Link
              key={cat.slug}
              href={`/books?category=${cat.slug}`}
              className="group block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A6847]"
            >
              <div className="h-full p-6 flex flex-col justify-between rounded-3xl bg-white/70 hover:bg-white border border-black/[0.08] hover:border-[#0A6847]/40 shadow-2xs hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-wider text-zinc-500 font-semibold uppercase">
                    SERIES 0{idx + 1}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0A6847] border border-emerald-100/60 font-semibold font-tamil">
                    {locale === "ta" ? cat.countTa : cat.countEn}
                  </span>
                </div>

                <div className="space-y-1.5 pt-6 font-tamil">
                  <h3 className="text-base sm:text-lg font-bold text-[#111111] group-hover:text-[#0A6847] transition-colors leading-snug font-tamil-serif">
                    {locale === "ta" ? cat.nameTa : cat.nameEn}
                  </h3>
                  <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed font-medium">
                    {locale === "ta" ? cat.descTa : cat.descEn}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-black/[0.06] flex items-center justify-between text-xs font-semibold text-[#0A6847] font-tamil">
                  <span>{locale === "ta" ? "நூல்களைக் காண்க" : "View Collection"}</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

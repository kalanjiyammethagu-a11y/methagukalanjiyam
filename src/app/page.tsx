import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  PostalSealIcon,
  ArchivalAudioReelIcon,
  ArchivalWaxSealIcon,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { HeroSlider } from "@/components/home/HeroSlider";
import {
  buildDynamicHeroSlides,
  defaultHeroSlides,
  type BlogPostSlideSource,
} from "@/data/hero-slides";
import { CategoryFilterTabs } from "@/components/home/CategoryFilterTabs";
import { allBooks, type BookItem } from "@/data/books";
import { createClient } from "@/lib/supabase/server";
import { mapDbBookToBookItem } from "@/lib/book-mappers";

export const metadata: Metadata = {
  title: "மேதகு களஞ்சியம் — Rare Tamil Literature & National Archives",
  description:
    "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம். அரிய வரலாற்று நூல்களை பாதுகாப்பாக ஆர்டர் செய்யுங்கள்.",
  alternates: {
    canonical: "https://methagukalanjiyam.in",
  },
  openGraph: {
    title: "மேதகு களஞ்சியம் — Rare Tamil Literature & National Archives",
    description:
      "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம்.",
    url: "https://methagukalanjiyam.in",
    siteName: "மேதகு களஞ்சியம்",
    locale: "ta_IN",
    type: "website",
    images: [
      {
        url: "/images/brand/banner-1200.webp",
        width: 1200,
        height: 675,
        alt: "மேதகு களஞ்சியம் பதாகை",
      },
    ],
  },
};

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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let books: BookItem[] = allBooks;
  let blogPosts: BlogPostSlideSource[] = [];

  try {
    const supabase = await createClient();
    const [{ data: dbBooks }, { data: dbPosts }] = await Promise.all([
      (supabase.from("books") as any)
        .select("*, categories(name_ta, name_en, slug)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .order("sort_order", { ascending: true }),
      (supabase.from("blog_posts") as any)
        .select("slug, cover_image_url, cover_image")
        .eq("status", "published"),
    ]);

    if (dbBooks && dbBooks.length > 0) {
      books = dbBooks.map((b: any) =>
        mapDbBookToBookItem(b, allBooks.find((sb) => sb.slug === b.slug))
      );
    }
    if (Array.isArray(dbPosts)) {
      blogPosts = dbPosts;
    }
  } catch (err) {
    console.error("Failed to fetch books on HomePage:", err);
  }

  const heroSlides =
    books.length > 0 || blogPosts.length > 0
      ? buildDynamicHeroSlides(books, blogPosts)
      : defaultHeroSlides;

  const spotlightBook =
    books.find((b) => b.slug === "katunayake-attack-victory") ||
    books.find((b) => b.featured) ||
    books[0];

  const categoryCounts = books.reduce<Record<string, number>>((acc, item) => {
    const slug = item.categorySlug || "history";
    acc[slug] = (acc[slug] || 0) + 1;
    return acc;
  }, {});

  const spotlightImage = spotlightBook
    ? spotlightBook.image.startsWith("http") || spotlightBook.image.startsWith("/")
      ? spotlightBook.image
      : `/${spotlightBook.image}`
    : "/images/books/book-placeholder.webp";

  return (
    <div className="space-y-16 sm:space-y-24 pb-24">
      {/* ============================================================
          1. SLIDE-BASED HERO CAROUSEL CONNECTED DYNAMICALLY TO SUPABASE
          ============================================================ */}
      <HeroSlider slides={heroSlides} priorityIndex={0} />

      {/* ============================================================
          2. ASYMMETRICAL EDITORIAL BENTO GRID (Complex Unique Layout)
          ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-black/8 dark:border-white/10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-zinc-100 font-tamil-serif leading-snug">
              களஞ்சியத் தனித்துவங்கள்
            </h2>
            <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 font-medium mt-1 font-tamil leading-relaxed">
              சரிபார்க்கப்பட்ட அரிய ஆவணங்கள், நேரடிப் பதிப்பக விநியோகம் மற்றும் டிஜிட்டல் களஞ்சியம் • Curated Archival Pillars
            </p>
          </div>
          <Link
            href="/books"
            className="text-xs sm:text-sm font-bold text-[#0A6847] dark:text-emerald-400 hover:underline flex items-center gap-1 font-tamil min-h-[44px]"
          >
            <span>முழுத் தொகுப்பை அறிக (Explore Archive)</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {/* Bento Tile 1: Primary Spotlight Book (Span 7) */}
          {spotlightBook && (
          <GlassPanel
            interactive
            className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between group rounded-3xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-[#0A6847] dark:text-emerald-400 uppercase font-tamil">
                  முதன்மை ஆவண நூல் (Primary Spotlight)
                </span>
                <span className="text-xs tabular-nums font-semibold text-[#666666] dark:text-zinc-400">
                  {spotlightBook.year} PUBLICATION
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
                <div className="sm:col-span-5 flex justify-center">
                  <div className="relative aspect-[3/4] w-44 rounded-xl overflow-hidden bg-[#ECE8DF] dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-xl group-hover:scale-103 transition-transform duration-300">
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10 pointer-events-none" />
                    <Image
                      src={spotlightImage}
                      alt={spotlightBook.title}
                      fill
                      sizes="180px"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-2.5 font-tamil">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-zinc-100 leading-snug font-tamil-serif">
                    {spotlightBook.title}
                  </h3>
                  <p className="text-xs font-bold text-[#0A6847] dark:text-emerald-400">
                    ஆசிரியர்: {spotlightBook.author}
                  </p>
                  <p className="text-xs text-[#444444] dark:text-zinc-300 leading-relaxed font-medium line-clamp-3">
                    {spotlightBook.descriptionTa ||
                      "ஈழ விடுதலைப் போராட்ட வரலாற்றில் சாந்தி நேசக்கரம் ஆவணப்படுத்திய அரிய வரலாற்றுத் தடம். நீண்டகால உழைப்பில் உருவான நேரடி ஆவணம்."}
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <Button href={`/books/${spotlightBook.slug}`} size="sm" variant="primary">
                      நூலை ஆர்டர் செய்க (Order Book - ₹{spotlightBook.price})
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-black/8 dark:border-white/10 flex items-center justify-between text-xs text-[#555555] dark:text-zinc-400 font-tamil">
              <span>நேரடிப் பதிப்பக அச்சுப் பதிப்பு (Original Press Edition)</span>
              <span className="font-bold text-[#0A6847] dark:text-emerald-400">
                {spotlightBook.stock > 0 ? "கையிருப்பில் உள்ளது (In Stock)" : "முன்பதிவு (Out of Stock)"}
              </span>
            </div>
          </GlassPanel>
          )}

          {/* Bento Tile 2: Postal Tracking & Shipping Integrity (Span 5) */}
          <GlassPanel
            interactive
            className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between rounded-3xl group bg-[#FBF9F4]/90 dark:bg-zinc-900/90"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 dark:bg-emerald-500/15 flex items-center justify-center text-[#0A6847] dark:text-emerald-400 shadow-2xs">
                <PostalSealIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                நேரடி தபால் & கண்காணிப்பு
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 leading-relaxed font-tamil font-medium">
                இந்தியா முழுவதும் India Post & ST Courier வழியாக பாதுகாப்பான தபால் சேவை. பார்சல் அனுப்பப்பட்டதும் SMS/WhatsApp வழியாக நேரடி டிராக்கிங் எண்.
              </p>
            </div>

            <div className="pt-5 border-t border-black/8 dark:border-white/10 space-y-2">
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-tamil">
                <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800/90 border border-black/[0.08] dark:border-white/10 shadow-2xs">
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">தமிழ்நாடு</div>
                  <div className="font-extrabold text-[#0A6847] dark:text-emerald-400">₹60</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800/90 border border-black/[0.08] dark:border-white/10 shadow-2xs">
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">பிற மாநிலம்</div>
                  <div className="font-extrabold text-[#0A6847] dark:text-emerald-400">₹100</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800/90 border border-black/[0.08] dark:border-white/10 shadow-2xs">
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">வெளிநாடு</div>
                  <div className="font-extrabold text-amber-800 dark:text-amber-300">DHL / Post</div>
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
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center text-amber-800 dark:text-amber-300 shadow-2xs">
                <ArchivalAudioReelIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                ஒலி & காணொளி ஆவணங்கள்
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 leading-relaxed font-tamil font-medium">
                வரலாற்றுப் பேரறிவிப்புகள், களத்து உரைகள் மற்றும் தேசிய ஆவணப் பதிவுகளின் தனித்துவமான ஒலி-காணொளி காப்பகம்.
              </p>
            </div>

            <div className="pt-6 border-t border-black/8 dark:border-white/10">
              <Button href="/videos" size="sm" variant="glass" className="w-full justify-between font-tamil font-bold">
                <span>ஆவணக் காணொளிகளைக் காண்க (Audio & Video)</span>
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
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center text-rose-700 dark:text-rose-300 shadow-2xs shrink-0">
                  <ArchivalWaxSealIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                    அழியாத தேசிய ஆவணப் பாதுகாப்பு
                  </h3>
                  <span className="text-xs text-[#0A6847] dark:text-emerald-400 font-semibold">100% Verified Provenance</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 leading-relaxed font-tamil font-medium">
                மேதகு களஞ்சியம் வணிக நோக்கற்ற ஒரு பண்பாட்டு ஆவணக் காப்பகம். அரிய நூல்கள் மீண்டும் அச்சேற்றப்பட்டு உலகத் தமிழர்களின் எதிர்கால சந்ததிக்காக டிஜிட்டல் முறையில் பாதுகாக்கப்படுகின்றன.
              </p>
            </div>

            <div className="pt-6 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-tamil">
              <span className="text-[#555555] dark:text-zinc-400">
                பதிவுச் சான்றிதழ் எண்: சரிபார்க்கப்பட்டது (UDYAM-TN-18-0101323)
              </span>
              <Button href="/certificate" size="sm" variant="outline" className="font-semibold text-xs">
                சான்றிதழ் காண்க (View Certificate)
              </Button>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* ============================================================
          3. HISTORICAL QUOTE BANNER (Dignified Archival Typography)
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center shadow-xs border border-black/8 dark:border-white/10 relative">
          <blockquote className="font-tamil-serif text-lg sm:text-2xl text-[#111111] dark:text-zinc-100 leading-relaxed">
            &ldquo;ஒரு விடுதலைப் போராளியின் சாவும் ஒரு சாதாரண மனிதனின் மரணமும் ஒன்றல்ல. அந்தச் சாவு சரித்திரத்தை உருவாக்குகிறது.&rdquo;
          </blockquote>
          <p className="mt-3 text-xs sm:text-sm text-[#666666] dark:text-zinc-400 font-serif italic" lang="en">
            &ldquo;The death of a liberation fighter and the demise of an ordinary man are never the same. That death authors living history.&rdquo;
          </p>
          <cite className="block mt-5 text-xs sm:text-sm font-bold tracking-wider text-[#0A6847] dark:text-emerald-400 uppercase font-tamil not-italic">
            — தேசியத் தலைவர் மேதகு வே. பிரபாகரன் (National Leader V. Prabhakaran)
          </cite>
        </div>
      </section>

      {/* ============================================================
          4. INTERACTIVE FILTERABLE BOOK CATALOG (Tactile Physical Books)
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <CategoryFilterTabs books={books} />
      </section>

      {/* ============================================================
          5. CURATED ARCHIVAL TAXONOMY DIRECTORY (Enterprise Museum Craft)
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="pb-3 border-b border-black/8 dark:border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-zinc-100 font-tamil-serif leading-snug">
            பிரிவு வாரியாக வாசியுங்கள்
          </h2>
          <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 font-medium mt-1 font-tamil leading-relaxed">
            தலைப்புகள், கள ஆவண வகைகள் மற்றும் வரலாற்று காலகட்டம் வாரியாக ஒழுங்கமைக்கப்பட்ட ஆவணத் தொகுப்பு • Archival Taxonomy
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const count = categoryCounts[cat.slug] ?? 0;
            return (
              <Link
                key={cat.slug}
                href={`/books?category=${cat.slug}`}
                className="group block p-6 rounded-3xl border border-black/8 dark:border-white/10 bg-white/75 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 hover:border-[#0A6847]/40 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 min-h-[44px]"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-[#0A6847] dark:text-emerald-300 bg-[#0A6847]/10 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full font-tamil">
                    {count > 0 ? `${count} நூல்கள்` : cat.countTa}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-[#0A6847] dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#111111] dark:text-zinc-100 group-hover:text-[#0A6847] dark:group-hover:text-emerald-400 transition-colors font-tamil leading-snug">
                  {cat.nameTa}
                </h3>
                <p className="text-xs text-[#666666] dark:text-zinc-400 font-medium mt-0.5 line-clamp-1">
                  {cat.nameEn}
                </p>
                <p className="mt-2.5 text-xs text-[#555555] dark:text-zinc-300 font-tamil leading-relaxed line-clamp-2">
                  {cat.descTa}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

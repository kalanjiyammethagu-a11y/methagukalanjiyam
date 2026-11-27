"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  PostalSealIcon,
  ArchivalAudioReelIcon,
  ArchivalWaxSealIcon,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLanguage } from "@/context/LanguageContext";
import { localized } from "@/lib/i18n";
import type { BookItem } from "@/data/books";
import { RecentAnnouncementsBanner } from "@/components/shared/RecentAnnouncementsBanner";
import type { AnnouncementItem } from "@/lib/announcements";

export interface HomeTaxonomyCategory {
  nameTa: string;
  nameEn: string;
  slug: string;
  descTa: string;
  descEn: string;
}

interface HomeBentoAndAnnouncementsProps {
  spotlightBook?: BookItem;
  spotlightImage: string;
  announcements: AnnouncementItem[];
}

export function HomeBentoAndAnnouncements({
  spotlightBook,
  spotlightImage,
  announcements,
}: HomeBentoAndAnnouncementsProps) {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const spotlightTitle = spotlightBook
    ? localized(spotlightBook, "title", locale, spotlightBook.title)
    : "";
  const spotlightAuthor = spotlightBook
    ? localized(spotlightBook, "author", locale, spotlightBook.author)
    : "";
  const spotlightDesc = spotlightBook
    ? localized(
        spotlightBook,
        "description",
        locale,
        isTa
          ? "ஈழ விடுதலைப் போராட்ட வரலாற்றில் சாந்தி நேசக்கரம் ஆவணப்படுத்திய அரிய வரலாற்றுத் தடம். நீண்டகால உழைப்பில் உருவான நேரடி ஆவணம்."
          : "A verified primary-source historical volume preserved and distributed by Saanthi Nesakaram & Methagu Kalanjiyam."
      )
    : "";

  return (
    <>
      {/* 2. ASYMMETRICAL EDITORIAL BENTO GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-black/8 dark:border-white/10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-zinc-100 font-tamil-serif leading-snug">
              {isTa ? "களஞ்சியத் தனித்துவங்கள்" : "Curated Archival Pillars"}
            </h2>
            <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 font-medium mt-1 font-tamil leading-relaxed">
              {isTa
                ? "சரிபார்க்கப்பட்ட அரிய ஆவணங்கள், நேரடிப் பதிப்பக விநியோகம் மற்றும் டிஜிட்டல் களஞ்சியம்"
                : "Verified primary historical texts, direct publisher dispatch, and digital preservation"}
            </p>
          </div>
          <Link
            href="/books"
            className="text-xs sm:text-sm font-bold text-[#0A6847] dark:text-emerald-400 hover:underline flex items-center gap-1 font-tamil min-h-[44px]"
          >
            <span>{isTa ? "முழுத் தொகுப்பை அறிக" : "Explore Full Archive"}</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {spotlightBook && (
            <GlassPanel
              interactive
              className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between group rounded-3xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-[#0A6847] dark:text-emerald-400 uppercase font-tamil">
                    {isTa ? "முதன்மை ஆவண நூல்" : "Primary Spotlight"}
                  </span>
                  <span className="text-xs tabular-nums font-semibold text-[#666666] dark:text-zinc-400">
                    {spotlightBook.year} {isTa ? "பதிப்பு" : "PUBLICATION"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
                  <div className="sm:col-span-5 flex justify-center">
                    <div className="relative aspect-[3/4] w-44 rounded-xl overflow-hidden bg-[#ECE8DF] dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-xl group-hover:scale-103 transition-transform duration-300">
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10 pointer-events-none" />
                      <Image
                        src={spotlightImage}
                        alt={spotlightTitle}
                        fill
                        sizes="180px"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-2.5 font-tamil">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-zinc-100 leading-snug font-tamil-serif">
                      {spotlightTitle}
                    </h3>
                    <p className="text-xs font-bold text-[#0A6847] dark:text-emerald-400">
                      {isTa ? `ஆசிரியர்: ${spotlightAuthor}` : `Author: ${spotlightAuthor}`}
                    </p>
                    <p className="text-xs text-[#444444] dark:text-zinc-300 leading-relaxed font-medium line-clamp-3">
                      {spotlightDesc}
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <Button href={`/books/${spotlightBook.slug}`} size="sm" variant="primary">
                        {isTa
                          ? `நூலை ஆர்டர் செய்க - ₹${spotlightBook.price}`
                          : `Order Book - ₹${spotlightBook.price}`}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-black/8 dark:border-white/10 flex items-center justify-between text-xs text-[#555555] dark:text-zinc-400 font-tamil">
                <span>
                  {isTa ? "நேரடிப் பதிப்பக அச்சுப் பதிப்பு" : "Original Press Edition"}
                </span>
                <span className="font-bold text-[#0A6847] dark:text-emerald-400">
                  {spotlightBook.stock > 0
                    ? isTa
                      ? "கையிருப்பில் உள்ளது"
                      : "In Stock"
                    : isTa
                    ? "முன்பதிவு"
                    : "Out of Stock"}
                </span>
              </div>
            </GlassPanel>
          )}

          {/* Bento Tile 2: Postal Tracking */}
          <GlassPanel
            interactive
            className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between rounded-3xl group bg-[#FBF9F4]/90 dark:bg-zinc-900/90"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 dark:bg-emerald-500/15 flex items-center justify-center text-[#0A6847] dark:text-emerald-400 shadow-2xs">
                <PostalSealIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "நேரடி தபால் & கண்காணிப்பு" : "Direct Dispatch & Tracking"}
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 leading-relaxed font-tamil font-medium">
                {isTa
                  ? "இந்தியா முழுவதும் India Post & ST Courier வழியாக பாதுகாப்பான தபால் சேவை. பார்சல் அனுப்பப்பட்டதும் SMS/WhatsApp வழியாக நேரடி டிராக்கிங் எண்."
                  : "Reliable doorstep delivery across India via India Post & ST Courier with live AWB tracking sent over WhatsApp and email."}
              </p>
            </div>

            <div className="pt-5 border-t border-black/8 dark:border-white/10 space-y-2">
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-tamil">
                <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800/90 border border-black/[0.08] dark:border-white/10 shadow-2xs">
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">
                    {isTa ? "தமிழ்நாடு" : "Tamil Nadu"}
                  </div>
                  <div className="font-extrabold text-[#0A6847] dark:text-emerald-400">₹60</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800/90 border border-black/[0.08] dark:border-white/10 shadow-2xs">
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">
                    {isTa ? "பிற மாநிலம்" : "Rest of India"}
                  </div>
                  <div className="font-extrabold text-[#0A6847] dark:text-emerald-400">₹100</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800/90 border border-black/[0.08] dark:border-white/10 shadow-2xs">
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">
                    {isTa ? "வெளிநாடு" : "Global"}
                  </div>
                  <div className="font-extrabold text-amber-800 dark:text-amber-300">DHL / Post</div>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Bento Tile 3: Multimedia Archives */}
          <GlassPanel
            interactive
            className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between rounded-3xl group"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center text-amber-800 dark:text-amber-300 shadow-2xs">
                <ArchivalAudioReelIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "ஒலி & காணொளி ஆவணங்கள்" : "Audio & Video Archives"}
              </h3>
              <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 leading-relaxed font-tamil font-medium">
                {isTa
                  ? "வரலாற்றுப் பேரறிவிப்புகள், களத்து உரைகள் மற்றும் தேசிய ஆவணப் பதிவுகளின் தனித்துவமான ஒலி-காணொளி காப்பகம்."
                  : "Rare historical speeches, commemorative broadcasts, and preserved documentary recordings."}
              </p>
            </div>

            <div className="pt-6 border-t border-black/8 dark:border-white/10">
              <Button href="/videos" size="sm" variant="glass" className="w-full justify-between font-tamil font-bold">
                <span>{isTa ? "ஆவணக் காணொளிகளைக் காண்க" : "Explore Audio & Video Archives"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassPanel>

          {/* Bento Tile 4: Provenance Verification */}
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
                    {isTa ? "அழியாத தேசிய ஆவணப் பாதுகாப்பு" : "Enduring Archival Preservation"}
                  </h3>
                  <span className="text-xs text-[#0A6847] dark:text-emerald-400 font-semibold">
                    {isTa ? "100% சரிபார்க்கப்பட்ட மூல ஆவணங்கள்" : "100% Verified Provenance"}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 leading-relaxed font-tamil font-medium">
                {isTa
                  ? "மேதகு களஞ்சியம் வணிக நோக்கற்ற ஒரு பண்பாட்டு ஆவணக் காப்பகம். அரிய நூல்கள் மீண்டும் அச்சேற்றப்பட்டு உலகத் தமிழர்களின் எதிர்கால சந்ததிக்காக டிஜிட்டல் முறையில் பாதுகாக்கப்படுகின்றன."
                  : "Methagu Kalanjiyam operates as a cultural archival initiative reprinting and safeguarding rare historical books for future generations worldwide."}
              </p>
            </div>

            <div className="pt-6 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-tamil">
              <span className="text-[#555555] dark:text-zinc-400">
                {isTa
                  ? "பதிவுச் சான்றிதழ் எண்: UDYAM-TN-18-0101323"
                  : "Registered MSME ID: UDYAM-TN-18-0101323"}
              </span>
              <Button href="/certificate" size="sm" variant="outline" className="font-semibold text-xs">
                {isTa ? "சான்றிதழ் காண்க" : "View Certificate"}
              </Button>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* RECENT ANNOUNCEMENTS BANNER (Editable from Admin -> Recent Announcements) */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecentAnnouncementsBanner announcements={announcements} />
        </section>
      )}
    </>
  );
}

interface HomeQuoteAndTaxonomyProps {
  categories: HomeTaxonomyCategory[];
  categoryCounts: Record<string, number>;
}

export function HomeQuoteBanner() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center shadow-xs border border-black/8 dark:border-white/10 relative">
        <blockquote className="font-tamil-serif text-lg sm:text-2xl text-[#111111] dark:text-zinc-100 leading-relaxed">
          {isTa
            ? "“ஒரு விடுதலைப் போராளியின் சாவும் ஒரு சாதாரண மனிதனின் மரணமும் ஒன்றல்ல. அந்தச் சாவு சரித்திரத்தை உருவாக்குகிறது.”"
            : "“The death of a liberation fighter and the demise of an ordinary man are never the same. That death authors living history.”"}
        </blockquote>
        <cite className="block mt-5 text-xs sm:text-sm font-bold tracking-wider text-[#0A6847] dark:text-emerald-400 uppercase font-tamil not-italic">
          {isTa
            ? "— தேசியத் தலைவர் மேதகு வே. பிரபாகரன்"
            : "— National Leader Hon. V. Prabhakaran"}
        </cite>
      </div>
    </section>
  );
}

export function HomeTaxonomySection({ categories, categoryCounts }: HomeQuoteAndTaxonomyProps) {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <div className="pb-3 border-b border-black/8 dark:border-white/10">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-zinc-100 font-tamil-serif leading-snug">
          {isTa ? "பிரிவு வாரியாக வாசியுங்கள்" : "Browse by Archival Taxonomy"}
        </h2>
        <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 font-medium mt-1 font-tamil leading-relaxed">
          {isTa
            ? "தலைப்புகள், கள ஆவண வகைகள் மற்றும் வரலாற்று காலகட்டம் வாரியாக ஒழுங்கமைக்கப்பட்ட ஆவணத் தொகுப்பு"
            : "Publications organized by historical eras, documented movements, and subject domains"}
        </p>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${
          categories.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        } gap-4 sm:gap-6`}
      >
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
                  {isTa ? `${count} நூல்கள்` : `${count} Books`}
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-[#0A6847] dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#111111] dark:text-zinc-100 group-hover:text-[#0A6847] dark:group-hover:text-emerald-400 transition-colors font-tamil leading-snug">
                {isTa ? cat.nameTa : cat.nameEn}
              </h3>
              <p className="text-xs text-[#666666] dark:text-zinc-400 font-medium mt-0.5 line-clamp-1">
                {isTa ? cat.nameEn : cat.nameTa}
              </p>
              <p className="mt-2.5 text-xs text-[#555555] dark:text-zinc-300 font-tamil leading-relaxed line-clamp-2">
                {isTa ? cat.descTa : cat.descEn}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

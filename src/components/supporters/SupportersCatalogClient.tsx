"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, ArrowRight } from "lucide-react";
import { ArchivalWaxSealIcon, ArchivalFolioIcon, PostalSealIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SupporterCard, type SupporterData } from "@/components/supporters/SupporterCard";
import { useLanguage } from "@/context/LanguageContext";

/* Authentic supporters roster extracted from supporters.html */
const allSupporters: SupporterData[] = [
  {
    id: "1",
    nameTa: "தீபக் ஹார்வின்",
    nameEn: "Deepak Harvin",
    roleTa: "நிறுவனத்தின் முதல்வர் மற்றும் நிறுவனர்",
    roleEn: "Founder & Principal Director",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/harvin.webp",
    instagramUrl: "https://www.instagram.com/harvin_72?igsh=MTI2bGhienR2ZHhhOA==",
    whatsappUrl: "https://wa.me/918248654946",
  },
  {
    id: "2",
    nameTa: "சுபி மதன்",
    nameEn: "Subi Madhan",
    roleTa: "நிறுவனத்தின் முதல்வர் மற்றும் நிறுவனர்",
    roleEn: "Founder & Principal Director",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/subi.webp",
    instagramUrl: "https://www.instagram.com/thilo.subi?igsh=aTczbzR1bTF3dWxo",
    whatsappUrl: "https://wa.me/916374849095",
  },
  {
    id: "3",
    nameTa: "பச்ச முத்து",
    nameEn: "Pacha Muthu",
    roleTa: "திட்ட நெறியாளர்",
    roleEn: "Project Coordinator & Operations",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/pachamuthu.webp",
    instagramUrl: "https://www.instagram.com/pachamuthu_2004?igsh=NjA2ZTZ0NmJycjY4",
  },
  {
    id: "4",
    nameTa: "ரஞ்சித்",
    nameEn: "Ranjith",
    roleTa: "களஞ்சிய மேலாண்மையாளர்",
    roleEn: "Archives & Fulfillment Manager",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/ranjith.webp",
    instagramUrl: "https://www.instagram.com/ranjith_tamileelam?igsh=NzhubzNvNHU3cnhz",
  },
  {
    id: "5",
    nameTa: "மதன் பாபு",
    nameEn: "Madhan Babu",
    roleTa: "தொழில்நுட்ப வடிவமைப்பாளர்",
    roleEn: "Technical Systems Architect",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/selva.webp",
    instagramUrl: "https://www.instagram.com/madhan_babu__?igsh=MXF5dWJmaWZ2N2dmag==",
  },
  {
    id: "6",
    nameTa: "வி. தமிழ் செல்வன்",
    nameEn: "V. Tamil Selvan",
    roleTa: "புத்தக சேகரிப்பாளர் & ஒருங்கிணைப்பாளர்",
    roleEn: "Archivist & Acquisitions Lead",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/suriya.webp",
    instagramUrl: "https://www.instagram.com/tamil_9443?igsh=dWJocGpsaHZ5Znh0",
  },
  {
    id: "7",
    nameTa: "ப. முத்து விக்னேஷ்",
    nameEn: "P. Muthu Vignesh",
    roleTa: "ஆவணப் பாதுகாப்பு அலுவலர்",
    roleEn: "Preservation & Digitization Lead",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/muniswaran.webp",
    instagramUrl: "https://www.instagram.com/mr_crazy_774?igsh=MThydmJqam1xN29mNw==",
  },
  {
    id: "8",
    nameTa: "இ. ஜெகதீசன்",
    nameEn: "E. Jegatheesan",
    roleTa: "தளவாட ஒருங்கிணைப்பாளர்",
    roleEn: "Postal Dispatch Coordinator",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/deelip.webp",
    instagramUrl: "https://www.instagram.com/itz__me__jega__?igsh=NnVmbmx2bnRveHJ3",
  },
  {
    id: "9",
    nameTa: "அரவிந்தன்",
    nameEn: "Aravinthan",
    roleTa: "கள ஒருங்கிணைப்பாளர்",
    roleEn: "Field Relations & Outreach",
    image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/supporters/ajay.webp",
    instagramUrl: "https://www.instagram.com/aravinth_tamizhan?igsh=ZTVuMDQ3cnFhcXZz",
  },
];

interface SupportersCatalogClientProps {
  initialSupporters?: SupporterData[];
}

export function SupportersCatalogClient({
  initialSupporters,
}: SupportersCatalogClientProps = {}) {
  const { locale } = useLanguage();
  const isTa = locale === "ta";
  const supporters = initialSupporters && initialSupporters.length > 0 ? initialSupporters : allSupporters;

  return (
    <div className="min-h-screen pb-24">
      {/* Top Breadcrumb Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "ஆதரவாளர்கள்" : "Guardians & Team" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A6847]/10 dark:bg-emerald-950/90 text-[#0A6847] dark:text-emerald-300 border border-[#0A6847]/20 dark:border-emerald-700/60 text-xs font-semibold font-tamil">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0A6847] dark:bg-emerald-400" />
            <span>{isTa ? "களஞ்சியக் காவலர்கள்" : "Archival Custodians"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111111] dark:text-zinc-100 tracking-tight font-tamil leading-tight">
            {isTa ? "களஞ்சியத்தின் ஆதரவாளர்கள்" : "Our Guardians & Contributors"}
          </h1>

          <p className="text-sm sm:text-base text-[#444444] dark:text-zinc-300 font-tamil max-w-2xl mx-auto leading-relaxed">
            {isTa
              ? "தமிழீழ தேசிய ஆவணங்கள் மற்றும் அரிய வரலாற்று நூல்களைக் காத்து, அடுத்த தலைமுறைக்குக் கடத்தும் பணியில் உறுதுணையாக நிற்கும் தோழர்கள்."
              : "Dedicated custodians and contributors committed to preserving authentic Tamil national literature and dispatching archival records worldwide."}
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-black/8 dark:border-white/10 rounded-3xl bg-white/75 dark:bg-zinc-900/85 divide-y md:divide-y-0 md:divide-x divide-black/8 dark:divide-white/10 shadow-xs">
          <div className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 dark:bg-emerald-500/15 text-[#0A6847] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArchivalFolioIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "ஆவணப் பாதுகாப்பு" : "Historical Preservation"}
              </h2>
              <p className="text-xs text-[#555555] dark:text-zinc-300 font-tamil mt-1 leading-relaxed">
                {isTa ? "அழிந்து போகும் தருவாயில் உள்ள அரிய தமிழ் தேசிய ஆவணங்களை மீட்டெடுத்தல்." : "Safeguarding endangered historical treatises and primary documents."}
              </p>
            </div>
          </div>

          <div className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 dark:bg-emerald-500/15 text-[#0A6847] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArchivalWaxSealIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "கூட்டுழைப்பு நெறி" : "Community Custodianship"}
              </h2>
              <p className="text-xs text-[#555555] dark:text-zinc-300 font-tamil mt-1 leading-relaxed">
                {isTa ? "இலாப நோக்கற்ற கூட்டுழைப்பு மற்றும் வாசகர்களின் நேரடிப் பங்களிப்பு." : "Non-profit cultural archival collective powered by reader stewardship."}
              </p>
            </div>
          </div>

          <div className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 dark:bg-emerald-500/15 text-[#0A6847] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <PostalSealIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "நேர்மையான சேவை" : "Official Dispatch & Registry"}
              </h2>
              <p className="text-xs text-[#555555] dark:text-zinc-300 font-tamil mt-1 leading-relaxed">
                {isTa ? "அரசு MSME பதிவுபெற்ற நம்பகமான ஆவண விநியோகம்." : "Government MSME Registered cultural distribution and postal dispatch."}
              </p>
            </div>
          </div>
        </div>

        {/* Supporters Grid (Gestalt Similarity) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {supporters.map((supporter) => (
            <SupporterCard
              key={supporter.id}
              supporter={supporter}
              locale={locale}
            />
          ))}
        </div>

        {/* Join as Supporter Callout Banner (Peak-End Rule) */}
        <div className="bg-[#FBF9F4] dark:bg-zinc-900 rounded-3xl p-8 sm:p-12 border border-black/8 dark:border-white/10 text-center max-w-3xl mx-auto space-y-5 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-[#0A6847] text-white flex items-center justify-center mx-auto shadow-md">
            <ArchivalWaxSealIcon className="h-7 w-7 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] dark:text-zinc-100 font-tamil">
              {isTa ? "நீங்களும் களஞ்சியத்திற்கு ஆதரவளிக்கலாம்" : "Support Our Preservation Mission"}
            </h2>
            <p className="text-xs sm:text-sm text-[#444444] dark:text-zinc-300 font-tamil max-w-lg mx-auto leading-relaxed">
              {isTa
                ? "தமிழீழ வரலாற்று நூல்கள், அரிய புகைப்படங்கள், ஒலி-ஒளி ஆவணங்கள் வைத்திருப்போர் களஞ்சியத்தோடு பகிர்ந்து பாதுகாக்க உதவலாம்."
                : "If you preserve rare documents, historical manuscripts, or wishes to support our archive logistics, connect with our team directly."}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/918248654946"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold shadow-md transition-all min-h-[44px]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{isTa ? "புலனத்தில் தொடர்பு கொள்ள" : "Contact via WhatsApp"}</span>
            </a>

            <Link
              href="/certificate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-black/12 dark:border-white/15 bg-white/85 dark:bg-zinc-800 hover:bg-black/5 dark:hover:bg-zinc-700 text-[#111111] dark:text-zinc-100 text-xs font-bold transition-all min-h-[44px]"
            >
              <span>{isTa ? "பதிவுச் சான்றிதழ் காண்க" : "View Official Certificate"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

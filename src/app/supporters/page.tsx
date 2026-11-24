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
    image: "/images/supporters/harvin.webp",
    instagramUrl: "https://www.instagram.com/harvin_72?igsh=MTI2bGhienR2ZHhhOA==",
    whatsappUrl: "https://wa.me/918248654946",
  },
  {
    id: "2",
    nameTa: "சுபி மதன்",
    nameEn: "Subi Madhan",
    roleTa: "நிறுவனத்தின் முதல்வர் மற்றும் நிறுவனர்",
    roleEn: "Founder & Principal Director",
    image: "/images/supporters/subi.webp",
    instagramUrl: "https://www.instagram.com/thilo.subi?igsh=aTczbzR1bTF3dWxo",
    whatsappUrl: "https://wa.me/916374849095",
  },
  {
    id: "3",
    nameTa: "பச்ச முத்து",
    nameEn: "Pacha Muthu",
    roleTa: "திட்ட நெறியாளர்",
    roleEn: "Project Coordinator & Operations",
    image: "/images/supporters/pachamuthu.webp",
    instagramUrl: "https://www.instagram.com/pachamuthu_2004?igsh=NjA2ZTZ0NmJycjY4",
  },
  {
    id: "4",
    nameTa: "ரஞ்சித்",
    nameEn: "Ranjith",
    roleTa: "களஞ்சிய மேலாண்மையாளர்",
    roleEn: "Archives & Fulfillment Manager",
    image: "/images/supporters/ranjith.webp",
    instagramUrl: "https://www.instagram.com/ranjith_tamileelam?igsh=NzhubzNvNHU3cnhz",
  },
  {
    id: "5",
    nameTa: "முனிஸ்வரன்",
    nameEn: "Muniswaran",
    roleTa: "பாண்டிமுனி படவரி நிர்வாகி மற்றும் தொடர்பு மேலாளர்",
    roleEn: "Media Administrator & Public Relations",
    image: "/images/supporters/muniswaran.webp",
    instagramUrl: "https://www.instagram.com/_pandimuni?igsh=ZXM3MTVlaHQ0aDdo",
  },
  {
    id: "6",
    nameTa: "அஜய்",
    nameEn: "Ajay",
    roleTa: "ஆவணப் பதிவாளர் மற்றும் ஒளிப்பதிவாளர்",
    roleEn: "Archival Documenter & Cinematographer",
    image: "/images/supporters/ajay.webp",
    instagramUrl: "https://www.instagram.com/d_ajay_offizal?igsh=Nmt3Z2JjM25tZXli",
    whatsappUrl: "https://wa.me/+919884325269",
  },
  {
    id: "7",
    nameTa: "சூரியபிரகாஷ்",
    nameEn: "Suriyaprakash",
    roleTa: "வலைத்தளம் மற்றும் தொழில்நுட்ப உருவாக்குநர்",
    roleEn: "Platform Architect & Technical Developer",
    image: "/images/supporters/suriya.webp",
    instagramUrl: "https://www.instagram.com/soora_byte?igsh=ZW5yNWlocGhoMGx3",
    whatsappUrl: "https://wa.me/916382630040",
  },
  {
    id: "8",
    nameTa: "திலீபன்",
    nameEn: "Dhilipan",
    roleTa: "தரவு ஒருங்கிணைப்பாளர்",
    roleEn: "Digital Catalog & Data Coordinator",
    image: "/images/supporters/deelip.webp",
    instagramUrl: "https://www.instagram.com/dhilip_offizial?igsh=Z2s1ejMyY2NhdWxq",
  },
  {
    id: "9",
    nameTa: "செல்வா",
    nameEn: "Selva",
    roleTa: "தமிழ்_வாரியர்ஸ் நிர்வாகி",
    roleEn: "Tamil Warriors Community Administrator",
    image: "/images/supporters/selva.webp",
    instagramUrl: "https://www.instagram.com/tamil_warriors2.0?igsh=MWFncHI4NndmN2hrcg==",
  },
];

export default function SupportersPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Top Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "ஆதரவாளர்கள்" : "Our Patrons & Team" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111111] tracking-tight font-tamil leading-tight">
            {isTa ? "களஞ்சியத்தின் ஆதரவாளர்கள்" : "Our Guardians & Contributors"}
          </h1>

          <p className="text-sm sm:text-base text-[#444444] font-tamil max-w-2xl mx-auto leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியத்தின் அரிய வரலாற்று நூல்களைப் பாதுகாத்து, ஆவணப்படுத்தி, வாசகர்களுக்கு நேர்த்தியாகக் கொண்டு சேர்க்கும் உழைப்பாளர்கள் மற்றும் தோழர்கள்."
              : "The dedicated custodians, editors, and volunteers who safeguard and courier our precious national literature to readers around the world."}
          </p>
        </div>

        {/* Archival Custodianship & Trust Ledger */}
        <div className="bg-white/95 rounded-2xl border border-black/8 shadow-2xs divide-y sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-3 divide-black/8 overflow-hidden">
          <div className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 text-[#0A6847] flex items-center justify-center shrink-0">
              <ArchivalWaxSealIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111111] font-tamil">
                {isTa ? "ஆவணப் பாதுகாப்பு" : "Historical Preservation"}
              </h2>
              <p className="text-xs text-[#555555] font-tamil mt-1 leading-relaxed">
                {isTa ? "அழிந்து போகும் தேசிய ஆவணங்களை மீட்டெடுத்துப் பாதுகாக்கும் பணி." : "Safeguarding endangered literature and uncompromised national monographs."}
              </p>
            </div>
          </div>

          <div className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 text-[#0A6847] flex items-center justify-center shrink-0">
              <ArchivalFolioIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111111] font-tamil">
                {isTa ? "கூட்டுழைப்பு நெறி" : "Community Custodianship"}
              </h2>
              <p className="text-xs text-[#555555] font-tamil mt-1 leading-relaxed">
                {isTa ? "இலாப நோக்கற்ற கூட்டுழைப்பு மற்றும் வாசகர்களின் நேரடிப் பங்களிப்பு." : "Non-profit cultural archival collective powered by reader stewardship."}
              </p>
            </div>
          </div>

          <div className="p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 text-[#0A6847] flex items-center justify-center shrink-0">
              <PostalSealIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111111] font-tamil">
                {isTa ? "நேர்மையான சேவை" : "Official Dispatch & Registry"}
              </h2>
              <p className="text-xs text-[#555555] font-tamil mt-1 leading-relaxed">
                {isTa ? "அரசு MSME பதிவுபெற்ற நம்பகமான ஆவண விநியோகம்." : "Government MSME Registered cultural distribution and postal dispatch."}
              </p>
            </div>
          </div>
        </div>

        {/* Supporters Grid (Gestalt Similarity) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {allSupporters.map((supporter) => (
            <SupporterCard
              key={supporter.id}
              supporter={supporter}
              locale={locale}
            />
          ))}
        </div>

        {/* Join as Supporter Callout Banner (Peak-End Rule) */}
        <div className="bg-[#FBF9F4] rounded-3xl p-8 sm:p-12 border border-black/8 text-center max-w-3xl mx-auto space-y-5 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-[#0A6847] text-white flex items-center justify-center mx-auto shadow-md">
            <ArchivalWaxSealIcon className="h-7 w-7 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] font-tamil">
              {isTa ? "நீங்களும் களஞ்சியத்திற்கு ஆதரவளிக்கலாம்" : "Support Our Preservation Mission"}
            </h2>
            <p className="text-xs sm:text-sm text-[#444444] font-tamil max-w-lg mx-auto leading-relaxed">
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-black/12 bg-white/80 hover:bg-black/5 text-[#111111] text-xs font-bold transition-all min-h-[44px]"
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

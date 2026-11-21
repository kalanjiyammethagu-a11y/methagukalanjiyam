"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  RotateCcw,
  ShieldAlert,
  Phone,
  Mail,
  ArrowRight,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";
import { PostalSealIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Top Breadcrumbs */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "விதிமுறைகளும் நிபந்தனைகளும்" : "Terms & Conditions" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0A6847]/10 text-[#0A6847] font-tamil">
            <FileText className="h-3.5 w-3.5" />
            {isTa ? "வெளிப்படையான சேவை விதிமுறைகள்" : "Transparent Commerce Terms"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight font-tamil leading-tight">
            {isTa ? "விதிமுறைகளும் நிபந்தனைகளும்" : "Terms & Conditions"}
          </h1>
          <p className="text-sm sm:text-base text-[#444444] font-tamil leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியம் புத்தக நிலையத்தின் சேவை விதிகள், அஞ்சல் கொள்கை மற்றும் நூல்கள் விநியோக விதிமுறைகள்."
              : "Standard policies governing book acquisition, shipping timelines, packaging, and replacement guarantees."}
          </p>
        </div>

        {/* Content Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-black/10 bg-white/90 shadow-xl space-y-8">
          
          {/* Welcome note */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs sm:text-sm text-[#333333] font-tamil leading-relaxed">
            <p>
              {isTa
                ? "மேதகு களஞ்சியம் புத்தக நிலையத்திற்கு உங்களை அன்போடு வரவேற்கிறோம். எங்கள் இணையப் பக்கத்தைப் பயன்படுத்துவதற்கும், அரிய வரலாற்று நூல்களைப் பெறுவதற்கும் கீழே உள்ள விதிமுறைகள் பொருந்தும்."
                : "Welcome to Methagu Kalanjiyam. By accessing our platform and placing orders for literature, you agree to the verified delivery and service terms detailed below."}
            </p>
          </div>

          {/* Section 1: General */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "பொதுவானவை" : "1. General Provisions"}
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-[#333333] font-tamil leading-relaxed list-disc list-inside">
              <li>
                {isTa
                  ? "இந்த இணையப் பக்கம் தமிழ் தேசியம் சார்ந்த, இணையத்தில் எளிதில் கிடைக்காத அரிய வரலாற்று நூல்களை வாசகர்களுக்குக் கொண்டு சேர்ப்பதை நோக்கமாகக் கொண்டது."
                  : "This platform is dedicated to preserving and courier delivery of rare Tamil historical monographs and national literature not readily available elsewhere."}
              </li>
              <li>
                {isTa
                  ? "இப்பக்கத்தில் உள்ள அனைத்து நூல்களின் விபரங்களும் விலைகளும் இருப்புக்கு ஏற்ப முன்னறிவிப்பின்றி மாற்றத்திற்குட்பட்டவை."
                  : "Book availability, stock counts, and prices are subject to periodic inventory updates."}
              </li>
            </ul>
          </section>

          {/* Section 2: Ordering & Payment */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "நூல்களைப் பெறும் முறை மற்றும் கட்டணம்" : "2. Ordering & Payment Protocol"}
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-[#333333] font-tamil leading-relaxed list-disc list-inside">
              <li>
                {isTa
                  ? "நூல்களை வாங்குவதற்கு 'கூடையில் சேர்த்தல்' அல்லது 'புலனம் (WhatsApp) வழி தொடர்புகொள்ளுதல்' முறைகளைப் பயன்படுத்தலாம்."
                  : "Books can be acquired via automated cart checkout or direct WhatsApp desk ordering."}
              </li>
              <li>
                {isTa
                  ? "நூல்கள் கையிருப்பில் உள்ளதா என்பதை உறுதி செய்த பின்னரே அதிகாரப்பூர்வப் பணப் பரிமாற்றம் மேற்கொள்ளப்படும்."
                  : "Stock availability is strictly verified before finalizing financial transactions to eliminate order uncertainty."}
              </li>
              <li>
                {isTa
                  ? "பணம் அனுப்பிய பின், உங்களது பெயர், தொடர்பு எண் மற்றும் முழு முகவரியைத் தெளிவாக அனுப்பி வைக்க வேண்டும்."
                  : "Upon payment confirmation, please supply accurate postal name, complete pin code, and delivery mobile number."}
              </li>
            </ul>
          </section>

          {/* Section 3: Postal Shipping (Highlight Card) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "அஞ்சல் கட்டணக் கொள்கை" : "3. Flat Shipping Rates"}
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A6847]/10 border border-[#0A6847]/20 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-[#0A6847] text-white flex items-center justify-center shrink-0 shadow-xs">
                <PostalSealIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#0A6847] font-tamil">
                  {isTa ? "தமிழ்நாடு முழுவதும் அஞ்சல் கட்டணம் வெறும் ₹60 மட்டுமே!" : "Flat ₹60 Shipping Everywhere Across Tamil Nadu"}
                </h3>
                <p className="text-xs sm:text-sm text-[#222222] font-tamil leading-relaxed">
                  {isTa
                    ? "நீங்கள் எங்களின் இணையப் பக்கத்தில் எத்தனை நூல்களைத் தேர்ந்தெடுத்து வாங்கினாலும், ஒட்டுமொத்தப் பொதிக்கு சேர்த்து ஒரே ஒரு முறை மட்டும் ₹60 கட்டணம் செலுத்தினால் போதுமானது."
                    : "No matter how many books you add to your order, you only pay a single flat postal fee of ₹60 per parcel across Tamil Nadu."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Dispatch & Tracking */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "பொதி மற்றும் தடம் அறிதல் (Tracking)" : "4. Packaging & Dispatch Timelines"}
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-[#333333] font-tamil leading-relaxed list-disc list-inside">
              <li>
                {isTa
                  ? "நூல்கள் இந்தியா போஸ்ட் (India Post) அல்லது எஸ்டி கூரியர் (ST Courier) மூலம் முறையாகப் பேக் செய்யப்பட்டு அனுப்பப்படும்."
                  : "Parcels are securely encased in moisture-resistant protective packaging and dispatched via India Post or ST Courier."}
              </li>
              <li>
                {isTa
                  ? "பொதி அனுப்பப்பட்டதும் அதன் AWB டிராக்கிங் எண் உங்களுக்கு வாட்ஸ்அப் வழியாகப் பகிரப்படும்; அதன் மூலம் பொதி எங்கு வருகிறது என்பதைத் தடம் செய்து கொள்ளலாம்."
                  : "Instant AWB tracking slips are provided to your WhatsApp so you can monitor your parcel's journey in real time."}
              </li>
              <li>
                {isTa
                  ? "பொதி அனுப்பியதிலிருந்து 2 முதல் 3 வேலை நாட்களில் நூல்கள் உங்கள் கைகளில் வந்து சேரும்."
                  : "Standard transit delivery time is 2 to 3 business days from parcel dispatch."}
              </li>
            </ul>
          </section>

          {/* Section 5: Returns & Unboxing Video Policy */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "நூல்கள் திரும்புதல் மற்றும் மாற்றுதல் கொள்கை" : "5. Return & Replacement Policy"}
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-[#333333] font-tamil leading-relaxed space-y-1">
                <p className="font-bold text-amber-900">
                  {isTa ? "பொதி பிரிக்கும் காணொளி (Unboxing Video) கட்டாயம்:" : "Mandatory Unboxing Video:"}
                </p>
                <p>
                  {isTa
                    ? "உங்களுக்கு அனுப்பப்பட்ட நூல் ஏதேனும் சேதமடைந்திருந்தாலோ அல்லது தவறான நூல் அனுப்பப்பட்டிருந்தாலோ, அதைப் பொதி பிரிக்கும் முழுமையான காணொளி ஆதாரத்துடன் 3 நாட்களுக்குள் எங்களது தொடர்பு எண்ணிற்குத் தெரிவித்தால், புதிய நூல் எவ்வித கூடுதல் கட்டணமுமின்றி மாற்றித் தரப்படும்."
                    : "If a book arrives damaged or misdelivered, notify us within 3 days with a continuous unboxing video recording, and a replacement copy will be dispatched immediately free of charge."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Official Helpline */}
          <section className="space-y-4 pt-4 border-t border-black/8">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                6
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "அதிகாரப்பூர்வ தொடர்பு மையம்" : "6. Support & Inquiries"}
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-black/3 border border-black/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#111111] font-tamil">
                  {isTa ? "மேதகு களஞ்சியம் வாடிக்கையாளர் உதவி" : "Methagu Kalanjiyam Helpdesk"}
                </p>
                <p className="text-xs text-[#555555] font-tamil">
                  {isTa ? "நூல்கள் மற்றும் விநியோகம் குறித்த எந்த சந்தேகத்திற்கும் தொடர்பு கொள்ளலாம்." : "Feel free to reach out for order tracking or special requests."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="tel:+918248654946"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs font-bold text-[#111111] hover:text-[#0A6847] shadow-2xs min-h-[44px]"
                >
                  <Phone className="h-3.5 w-3.5 text-[#0A6847]" />
                  <span>+91 82486 54946</span>
                </a>
                <a
                  href="mailto:methagukalanjiyam@gmail.com"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A6847] text-white text-xs font-bold hover:bg-[#085237] shadow-2xs min-h-[44px]"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </section>

          {/* Bottom Action */}
          <div className="pt-6 border-t border-black/8 flex items-center justify-between">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0A6847] hover:underline min-h-[44px]"
            >
              <span>{isTa ? "தனியுரிமைக் கொள்கை படிக்க" : "Read Privacy Policy"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import { PostalSealIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/context/LanguageContext";

export function TermsClient() {
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0A6847]/10 dark:bg-emerald-950/90 text-[#0A6847] dark:text-emerald-300 border border-[#0A6847]/20 dark:border-emerald-700/60 font-tamil">
            <FileText className="h-3.5 w-3.5" />
            {isTa ? "வெளிப்படையான சேவை விதிமுறைகள்" : "Transparent Commerce Terms"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] dark:text-zinc-100 tracking-tight font-tamil leading-tight">
            {isTa ? "விதிமுறைகளும் நிபந்தனைகளும்" : "Terms & Conditions"}
          </h1>
          <p className="text-sm sm:text-base text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியம் புத்தக நிலையத்தின் சேவை விதிகள், அஞ்சல் கொள்கை மற்றும் நூல்கள் விநியோக விதிமுறைகள்."
              : "Standard policies governing book acquisition, shipping timelines, packaging, and replacement guarantees."}
          </p>
        </div>

        {/* Content Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1F1F23] shadow-xl space-y-8">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8 dark:border-white/10">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "பொதுவான பயன்பாட்டு விதிகள்" : "1. Terms of Use"}
              </h2>
            </div>
            <p className="text-sm text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
              {isTa
                ? "இவ்வலைதளத்தை பார்வையிடுவதன் மூலமும், இதன் வழியே நூல்களை ஆர்டர் செய்வதன் மூலமும் நீங்கள் இவ்வனைத்து விதிமுறைகளையும் முழுமையாக ஏற்றுக்கொள்கிறீர்கள். மேதகு களஞ்சியம் அரிய வரலாற்று இலக்கியங்களை வாசகர்களிடம் கொண்டு சேர்க்கும் நோக்கில் இயங்குகிறது."
                : "By accessing this portal and purchasing books, you agree to these transparent terms. Methagu Kalanjiyam operates with the sacred objective of preserving authentic historical documentation and literature."}
            </p>
          </section>

          {/* Section 2: Postal & Dispatch */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8 dark:border-white/10">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil flex items-center gap-2">
                <span>{isTa ? "அஞ்சல் மற்றும் விநியோகக் கொள்கை" : "2. Postal & Dispatch Policy"}</span>
                <PostalSealIcon className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
              </h2>
            </div>
            <p className="text-sm text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
              {isTa
                ? "உங்கள் ஆர்டர்கள் உறுதி செய்யப்பட்ட 24 முதல் 48 மணி நேரத்திற்குள் இந்தியா போஸ்ட் (Speed Post) அல்லது எஸ்டி கூரியர் (ST Courier) வழியே பொதியிடப்பட்டு அனுப்பி வைக்கப்படும்."
                : "All confirmed orders are packed with water-resistant protective wrapping and dispatched within 24 to 48 hours via India Post Speed Post or reliable regional couriers (ST Courier)."}
            </p>
            <ul className="text-xs text-[#555555] dark:text-zinc-300 font-tamil space-y-1.5 pl-4 list-disc">
              <li>{isTa ? "தமிழ்நாடு & புதுச்சேரி: 2 - 4 வேலை நாட்களுக்குள்" : "Tamil Nadu & Puducherry: 2 to 4 business days"}</li>
              <li>{isTa ? "இதர இந்திய மாநிலங்கள்: 4 - 7 வேலை நாட்களுக்குள்" : "Other Indian States: 4 to 7 business days"}</li>
              <li>{isTa ? "சர்வதேச தபால்: 10 - 15 வேலை நாட்களுக்குள்" : "International Airmail: 10 to 15 business days"}</li>
            </ul>
          </section>

          {/* Section 3: Pricing */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8 dark:border-white/10">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "விலை மற்றும் கட்டண விவரங்கள்" : "3. Pricing & Payments"}
              </h2>
            </div>
            <p className="text-sm text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
              {isTa
                ? "தளத்தில் குறிப்பிடப்பட்டுள்ள அனைத்து விலைகளும் இந்திய ரூபாயில் (INR) நிர்ணயிக்கப்பட்டுள்ளன. கட்டணங்கள் Razorpay வாயிலாகவோ அல்லது அதிகாரப்பூர்வ வங்கிக் கணக்கிற்கு UPI மூலமாகவோ மட்டுமே செலுத்தப்பட வேண்டும்."
                : "All prices on our platform are denominated in Indian Rupees (INR). Payments must be fulfilled exclusively via our integrated Razorpay checkout or verified UPI handles."}
            </p>
          </section>

          {/* Section 4: Replacement, Cancellation & Refunds */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8 dark:border-white/10">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil flex items-center gap-2">
                <span>
                  {isTa
                    ? "ஆர்டர் ரத்து, மாற்று மற்றும் பணம் திரும்பப் பெறும் கொள்கை"
                    : "4. Cancellation, Replacement & Refund Policy"}
                </span>
                <ShieldAlert className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
              </h2>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/8 dark:bg-amber-950/60 border border-amber-500/20 dark:border-amber-700/60 text-xs sm:text-sm text-[#222222] dark:text-zinc-200 font-tamil space-y-2.5">
              <p className="font-bold text-[#111111] dark:text-amber-200">
                {isTa
                  ? "சேதமடைந்த நூல்களுக்கு உடனடி மாற்று நூல் & கட்டணத் திரும்பப் பெறுதல்:"
                  : "Hassle-Free Replacement & 5–7 Day Refund SLA:"}
              </p>
              <p className="leading-relaxed text-[#444444] dark:text-zinc-200">
                {isTa
                  ? "உங்களுக்கு அனுப்பப்பட்ட நூல் ஏதேனும் சேதமடைந்திருந்தாலோ அல்லது தவறான நூல் அனுப்பப்பட்டிருந்தாலோ, அதைப் பொதி பிரிக்கும் முழுமையான காணொளி ஆதாரத்துடன் 3 நாட்களுக்குள் எங்களது தொடர்பு எண்ணிற்குத் தெரிவித்தால், புதிய நூல் எவ்வித கூடுதல் கட்டணமுமின்றி மாற்றித் தரப்படும்."
                  : "If a book arrives damaged or misdelivered, notify us within 3 days with a continuous unboxing video recording, and a replacement copy will be dispatched immediately free of charge."}
              </p>
              <p className="leading-relaxed text-[#444444] dark:text-zinc-200">
                {isTa
                  ? "பார்சல் அஞ்சலில் அனுப்பப்படுவதற்கு முன்பாக ஆர்டரை ரத்து செய்ய WhatsApp அல்லது தொலைபேசி மூலம் தொடர்பு கொள்ளலாம். அங்கீகரிக்கப்பட்ட ரத்து அல்லது கையிருப்பு இல்லாத ஆர்டர்களுக்கான முழுத் தொகையும் Razorpay வழியே உங்கள் அசல் UPI / வங்கிக் கணக்கிற்கு 5 முதல் 7 வேலை நாட்களுக்குள் திருப்பிச் செலுத்தப்படும்."
                  : "Orders may be cancelled prior to postal dispatch via WhatsApp or phone support. Approved refunds (for pre-dispatch cancellations or unfulfillable stock) are credited back to your original UPI/card source via Razorpay within 5 to 7 business days."}
              </p>
            </div>
          </section>

          {/* Section 5: Support */}
          <section className="space-y-4 pt-4 border-t border-black/8 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "அதிகாரப்பூர்வ தொடர்பு மையம் & பதிவு விவரம்" : "5. Support, Jurisdiction & Merchant Details"}
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-black/3 dark:bg-white/[0.04] border border-black/8 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  {isTa ? "மேதகு களஞ்சியம் வாடிக்கையாளர் உதவி (MSME: UDYAM-TN-18-0101323)" : "Methagu Kalanjiyam Helpdesk (MSME: UDYAM-TN-18-0101323)"}
                </p>
                <p className="text-xs text-[#555555] dark:text-zinc-300 font-tamil">
                  {isTa ? "தமிழ்நாடு, இந்தியா • நூல்கள் மற்றும் விநியோகம் குறித்த எந்த சந்தேகத்திற்கும் தொடர்பு கொள்ளலாம்." : "Tamil Nadu, India • Reach out for order tracking, cancellations, or special requests."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/916384654946"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/15 text-xs font-bold text-[#111111] dark:text-zinc-100 hover:text-[#0A6847] dark:hover:text-emerald-400 shadow-2xs min-h-[44px]"
                >
                  <Phone className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
                  <span>{isTa ? "WhatsApp எண் : 6384654946" : "+91 63846 54946"}</span>
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
          <div className="pt-6 border-t border-black/8 dark:border-white/10 flex items-center justify-between">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0A6847] dark:text-emerald-400 hover:underline min-h-[44px]"
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

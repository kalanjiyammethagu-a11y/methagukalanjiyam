"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Phone, Mail, ArrowRight, Lock, FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPolicyPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Top Breadcrumbs */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "தனியுரிமைக் கொள்கை" : "Privacy Policy" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0A6847]/10 text-[#0A6847] font-tamil">
            <Lock className="h-3.5 w-3.5" />
            {isTa ? "வாசகர் தரவுப் பாதுகாப்பு" : "Reader Data Protection"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight font-tamil leading-tight">
            {isTa ? "தனியுரிமைக் கொள்கை" : "Privacy Policy"}
          </h1>
          <p className="text-sm sm:text-base text-[#444444] font-tamil leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியத்தில் வாசகர்களின் தனிப்பட்ட விபரங்கள் எவ்வாறு பாதுகாக்கப்படுகின்றன என்பது பற்றிய முழுமையான அறிக்கை."
              : "Clear details on how reader data is collected, handled, and strictly protected by Methagu Kalanjiyam."}
          </p>
        </div>

        {/* Content Card (High Readability & Miller's Law) */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-black/10 bg-white/90 shadow-xl space-y-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "சேகரிக்கப்படும் விபரங்கள்" : "1. Information We Collect"}
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-[#333333] font-tamil leading-relaxed list-disc list-inside">
              <li>
                {isTa
                  ? "எங்களது இணையப் பக்கத்தில் வாசகர்களின் விபரங்களைத் தானாகச் சேகரிக்கும் ரகசிய மென்பொருள் வசதிகள் எதுவும் இல்லை."
                  : "We do not run tracking spyware or intrusive third-party background telemetry on this platform."}
              </li>
              <li>
                {isTa
                  ? "நீங்கள் நூல்களை வாங்குவதற்காக எங்களைத் தொடர்பு கொள்ளும்போது மட்டுமே உங்களது பெயர், தொடர்பு எண், மற்றும் முகவரி ஆகிய விபரங்கள் பெறப்படுகின்றன."
                  : "Personal details (name, delivery address, phone number) are only gathered when you place an order for book fulfillment."}
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "விபரங்கள் பயன்படுத்தப்படும் முறை" : "2. How Information is Used"}
              </h2>
            </div>
            <p className="text-sm text-[#333333] font-tamil leading-relaxed">
              {isTa
                ? "வாசகர்கள் வழங்கும் முகவரி மற்றும் தொடர்பு விபரங்கள் கீழ்க்காணும் நோக்கங்களுக்காக மட்டுமே பயன்படுத்தப்படும்:"
                : "Your postal address and contact credentials are used strictly for the following fulfillment purposes:"}
            </p>
            <ul className="space-y-2 text-sm text-[#333333] font-tamil leading-relaxed list-disc list-inside">
              <li>
                {isTa
                  ? "நீங்கள் கோரிய நூற்பொதியை விரைவு அஞ்சல் அல்லது ST தூதுச் சேவை மூலம் உங்களது இருப்பிடத்திற்குச் சரியாக அனுப்பி வைக்க."
                  : "To dispatch your book parcel via India Post or ST Courier directly to your specified doorstep."}
              </li>
              <li>
                {isTa
                  ? "நூல்கள் அனுப்பப்பட்டதற்கான தடைய ஆவணங்களை (AWB Tracking) உங்களது புலனத்திற்குப் பகிர்ந்து, தகவல்களை உறுதிப்படுத்த."
                  : "To share parcel tracking documentation (AWB number) to your phone via WhatsApp/SMS."}
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "பாதுகாப்பு உறுதிமொழி" : "3. Confidentiality Guarantee"}
              </h2>
            </div>
            <div className="p-4 rounded-2xl bg-[#0A6847]/10 border border-[#0A6847]/20 space-y-2">
              <div className="flex items-center gap-2 text-[#0A6847] font-bold text-sm font-tamil">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <span>{isTa ? "தரவு பகிர்வுக்கு எதிரான 100% உத்தரவாதம்" : "Strict Zero-Sharing Guarantee"}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#222222] font-tamil leading-relaxed">
                {isTa
                  ? "வாசகர்களின் தனிப்பட்ட முகவரி மற்றும் தொடர்பு எண்கள் எக்காரணம் கொண்டும் பிற நபர்களுக்கோ அல்லது விளம்பர நிறுவனங்களுக்கோ விற்கப்படவோ அல்லது பகிரப்படவோ மாட்டாது. உங்களது விபரங்கள் அனைத்தும் பாதுகாப்பாக மட்டுமே வைத்திருக்கப்படும்."
                  : "Reader addresses, phone numbers, and orders will never be leased, sold, or shared with advertisers or third parties under any circumstances."}
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "வெளிப்புற சேவைகள் மற்றும் தொடர்புகள்" : "4. External Platforms"}
              </h2>
            </div>
            <p className="text-sm text-[#333333] font-tamil leading-relaxed">
              {isTa
                ? "எங்களது இணையப் பக்கத்தில் உங்களை எங்களோடு இணைப்பதற்காக வாட்ஸ்அப் (புலனம்) இணைப்பு கொடுக்கப்பட்டுள்ளது. அதனை வைத்து நீங்கள் தொடர்புகொள்ளும்போது, அந்த நிறுவனத்தின் பாதுகாப்பு விதிகள் பொருந்தும்."
                : "Where links to WhatsApp or courier tracking portals are provided, their respective standard data protection policies govern those interactions."}
            </p>
          </section>

          {/* Section 5: Help & Inquiries */}
          <section className="space-y-4 pt-4 border-t border-black/8">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 text-[#0A6847] font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h2 className="text-lg font-bold text-[#111111] font-tamil">
                {isTa ? "தனியுரிமை குறித்த கேள்விகளுக்கு" : "5. Privacy Inquiries"}
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-black/3 border border-black/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#111111] font-tamil">
                  {isTa ? "மேதகு களஞ்சியம் ஆதரவு மையம்" : "Methagu Kalanjiyam Support Desk"}
                </p>
                <p className="text-xs text-[#555555] font-tamil">
                  {isTa ? "நேரடி உதவிக்கு எங்களை எப்போதும் தொடர்பு கொள்ளலாம்." : "Reach out for any queries regarding your personal data."}
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

          {/* Footer Navigation Link */}
          <div className="pt-6 border-t border-black/8 flex items-center justify-between">
            <Link
              href="/terms"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0A6847] hover:underline min-h-[44px]"
            >
              <FileText className="h-4 w-4" />
              <span>{isTa ? "விதிமுறைகள் மற்றும் நிபந்தனைகள் பார்க்க" : "View Terms & Conditions"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

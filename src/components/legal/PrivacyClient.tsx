"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Phone, Mail, ArrowRight, Lock, FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/context/LanguageContext";

export function PrivacyClient() {
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0A6847]/10 dark:bg-emerald-950/90 text-[#0A6847] dark:text-emerald-300 border border-[#0A6847]/20 dark:border-emerald-700/60 font-tamil">
            <Lock className="h-3.5 w-3.5" />
            {isTa ? "வாசகர் தரவுப் பாதுகாப்பு" : "Reader Data Protection"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] dark:text-zinc-100 tracking-tight font-tamil leading-tight">
            {isTa ? "தனியுரிமைக் கொள்கை" : "Privacy Policy"}
          </h1>
          <p className="text-sm sm:text-base text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியத்தில் வாசகர்களின் தனிப்பட்ட விபரங்கள் எவ்வாறு பாதுகாக்கப்படுகின்றன என்பது பற்றிய முழுமையான அறிக்கை."
              : "Clear details on how reader data is collected, handled, and strictly protected by Methagu Kalanjiyam."}
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
                {isTa ? "நாங்கள் சேகரிக்கும் தகவல்கள்" : "1. Information We Collect"}
              </h2>
            </div>
            <p className="text-sm text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
              {isTa
                ? "நீங்கள் ஆர்டர் செய்யும் போது உங்கள் பெயர், தபால் முகவரி, தொலைபேசி எண் மற்றும் மின்னஞ்சல் முகவரி ஆகியவற்றை மட்டுமே நாங்கள் சேகரிக்கிறோம். இது தபால் மூலம் நூல்களை உங்களுக்குச் சரியாக விநியோகம் செய்ய மட்டுமே பயன்படுத்தப்படுகிறது."
                : "We collect only essential details required to fulfill your book delivery: your name, shipping address, mobile number, and email. These details are used exclusively for shipping logistics."}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8 dark:border-white/10">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "கட்டணப் பாதுகாப்பு (Razorpay)" : "2. Payment Data Security"}
              </h2>
            </div>
            <p className="text-sm text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
              {isTa
                ? "உங்கள் வங்கி அட்டை, UPI அல்லது நெட் பேங்கிங் விவரங்கள் எதுவும் எங்கள் சர்வரில் சேமிக்கப்படுவதில்லை. அனைத்துப் பணப் பரிவர்த்தனைகளும் இந்திய ரிசர்வ் வங்கியால் (RBI) அங்கீகரிக்கப்பட்ட Razorpay PCI-DSS Level 1 குறியாக்க பாதுகாப்பு வழியாக மட்டுமே நடைபெறுகின்றன."
                : "We do not store your credit/debit card numbers, CVVs, or UPI PINs. All financial transactions are securely processed through Razorpay's RBI-compliant, PCI-DSS Level 1 certified gateway with 256-bit encryption."}
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8 dark:border-white/10">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "மூன்றாம் தரப்புப் பகிர்வின்மை" : "3. No Third-Party Data Sharing"}
              </h2>
            </div>
            <p className="text-sm text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
              {isTa
                ? "வாசகர்களின் தனிப்பட்ட தகவல்கள் எக்காரணம் கொண்டும் வர்த்தக விளம்பரங்களுக்கோ அல்லது வேறு நிறுவனங்களுக்கோ விற்கப்படவோ, பகிரப்படவோ மாட்டாது. உங்கள் ஆர்டரை கொண்டு சேர்க்கும் தபால் நிறுவனத்திற்கு (India Post / ST Courier) மட்டுமே முகவரி பகிரப்படும்."
                : "We never sell, rent, or trade your personal information to third-party advertisers. Your address details are shared strictly with our postal partners (India Post / ST Courier) solely to deliver your package."}
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8 dark:border-white/10">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "குக்கீகள் மற்றும் சாதன சேமிப்பு" : "4. Cookies & Local Storage"}
              </h2>
            </div>
            <p className="text-sm text-[#444444] dark:text-zinc-300 font-tamil leading-relaxed">
              {isTa
                ? "எங்கள் தளம் உங்கள் விருப்ப மொழி (தமிழ்/ஆங்கிலம்) மற்றும் கூடைப் பொருட்களை நினைவில் வைத்திருக்க உங்கள் உலாவியின் LocalStorage-ஐ மட்டுமே பயன்படுத்துகிறது. விளம்பர கண்காணிப்பு குக்கீகள் பயன்படுத்தப்படுவதில்லை."
                : "Our website uses local browser storage solely to preserve your preferred language (Tamil/English), font sizes, and cart contents. We do not deploy invasive cross-site advertising cookies."}
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-black/8 dark:border-white/10">
              <span className="h-6 w-6 rounded-lg bg-[#0A6847]/10 dark:bg-emerald-500/20 text-[#0A6847] dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h2 className="text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                {isTa ? "தனியுரிமை குறித்த கேள்விகளுக்கு" : "5. Privacy Inquiries"}
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-black/3 dark:bg-white/[0.04] border border-black/8 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  {isTa ? "மேதகு களஞ்சியம் ஆதரவு மையம்" : "Methagu Kalanjiyam Support Desk"}
                </p>
                <p className="text-xs text-[#555555] dark:text-zinc-300 font-tamil">
                  {isTa ? "நேரடி உதவிக்கு எங்களை எப்போதும் தொடர்பு கொள்ளலாம்." : "Reach out for any queries regarding your personal data."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="tel:+918248654946"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/15 text-xs font-bold text-[#111111] dark:text-zinc-100 hover:text-[#0A6847] dark:hover:text-emerald-400 shadow-2xs min-h-[44px]"
                >
                  <Phone className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
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
          <div className="pt-6 border-t border-black/8 dark:border-white/10 flex items-center justify-between">
            <Link
              href="/terms"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0A6847] dark:text-emerald-400 hover:underline min-h-[44px]"
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

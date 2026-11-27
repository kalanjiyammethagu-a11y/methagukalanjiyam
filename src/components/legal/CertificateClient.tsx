"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ZoomIn,
  X,
  Phone,
  Mail,
  FileText,
  ArrowRight,
  Building,
  Download,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/context/LanguageContext";

export function CertificateClient() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";
  const [zoomOpen, setZoomOpen] = React.useState(false);

  // Lock body scroll and close on Escape when zoom modal is active
  React.useEffect(() => {
    if (zoomOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setZoomOpen(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
    return undefined;
  }, [zoomOpen]);

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Top Breadcrumb */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "பதிவுச் சான்றிதழ்" : "Official Certificate" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0A6847]/10 dark:bg-emerald-950/90 text-[#0A6847] dark:text-emerald-300 border border-[#0A6847]/20 dark:border-emerald-700/60 font-tamil">
            <Award className="h-3.5 w-3.5" />
            {isTa ? "இந்திய அரசு அங்கீகாரம்" : "Government of India Registered"}
          </span>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] dark:text-zinc-100 font-tamil tracking-tight">
            {isTa ? "மத்திய அரசு MSME உத்யம் பதிவுச் சான்றிதழ்" : "MSME Udyam Registration Certificate"}
          </h1>

          <p className="text-xs sm:text-sm text-[#555555] dark:text-zinc-300 font-tamil max-w-xl mx-auto leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியம் இந்திய அரசின் குறு, சிறு மற்றும் நடுத்தர தொழில் அமைச்சகத்தில் (Ministry of MSME) முறையாகப் பதிவு செய்யப்பட்டுள்ளது."
              : "Methagu Kalanjiyam is officially registered under the Ministry of Micro, Small and Medium Enterprises, Government of India."}
          </p>
        </div>

        {/* Certificate Display Card with Zoom Action */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-black/10 dark:border-white/10 bg-white dark:bg-[#1F1F23] shadow-sm space-y-8">
          
          {/* Certificate Frame with Interactive Zoom Hover */}
          <div className="relative group max-w-xl mx-auto rounded-2xl overflow-hidden border border-black/12 shadow-md bg-neutral-50">
            <div className="relative aspect-[1/1.414] w-full">
              <Image
                src="/images/brand/certificate-seal.webp"
                alt={isTa ? "மேதகு களஞ்சியம் MSME சான்றிதழ்" : "Methagu Kalanjiyam MSME Certificate"}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-contain p-2 sm:p-4 transition-transform duration-300 group-hover:scale-[1.02]"
                priority
              />
            </div>

            {/* Tap/Click Zoom Trigger Overlay */}
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm font-tamil backdrop-blur-xs cursor-pointer min-h-[44px]"
              aria-label={isTa ? "சான்றிதழை பெரிதாக்கிக் காண்க" : "Enlarge certificate view"}
            >
              <div className="px-4 py-2 rounded-xl bg-[#0A6847] flex items-center gap-2 shadow-lg">
                <ZoomIn className="h-4 w-4" />
                <span>{isTa ? "பெரிதாக்கிக் காண்க" : "Click to Enlarge"}</span>
              </div>
            </button>
          </div>

          {/* Quick Enlarge & Download Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/12 dark:border-white/15 hover:border-[#0A6847] dark:hover:border-emerald-400 bg-white/85 dark:bg-zinc-800 hover:bg-[#0A6847]/5 dark:hover:bg-emerald-500/10 text-xs font-bold text-[#111111] dark:text-zinc-100 hover:text-[#0A6847] dark:hover:text-emerald-300 transition-all cursor-pointer min-h-[44px]"
            >
              <ZoomIn className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
              <span>{isTa ? "முழுத் திரையில் காண்க" : "View Fullscreen"}</span>
            </button>

            <a
              href="/images/brand/certificate-seal.webp"
              download="Methagu-Kalanjiyam-MSME-Certificate.webp"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-bold text-[#111111] dark:text-zinc-100 transition-all min-h-[44px]"
            >
              <Download className="h-4 w-4 text-[#555555] dark:text-zinc-300" />
              <span>{isTa ? "பதிவிறக்கம் செய்க" : "Download Certificate"}</span>
            </a>
          </div>

          {/* Registration Key Facts Grid */}
          <div className="border-t border-black/8 dark:border-white/10 pt-8 space-y-4">
            <h2 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
              {isTa ? "அரசுப் பதிவு விவரங்கள்" : "Official Registry Parameters"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-black/3 dark:bg-white/[0.04] border border-black/6 dark:border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-[#555555] dark:text-zinc-400 font-tamil block">
                  {isTa ? "உத்யம் பதிவு எண் (Udyam Reg. No.)" : "Udyam Registration Number"}
                </span>
                <span className="text-sm font-mono font-bold text-[#0A6847] dark:text-emerald-400">
                  UDYAM-TN-18-0101323
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/3 dark:bg-white/[0.04] border border-black/6 dark:border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-[#555555] dark:text-zinc-400 font-tamil block">
                  {isTa ? "நிறுவனத்தின் பெயர்" : "Enterprise Legal Name"}
                </span>
                <span className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  மேதகு களஞ்சியம் (METHAGU KALANJIYAM)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/3 dark:bg-white/[0.04] border border-black/6 dark:border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-[#555555] dark:text-zinc-400 font-tamil block">
                  {isTa ? "தொழில் வகை" : "Type of Enterprise"}
                </span>
                <span className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
                  <span>{isTa ? "நுண் நிறுவனம் (Micro Enterprise)" : "Micro Enterprise (Trading & Publishing)"}</span>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/3 dark:bg-white/[0.04] border border-black/6 dark:border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-[#555555] dark:text-zinc-400 font-tamil block">
                  {isTa ? "பதிவு பெற்ற மாநிலம் & வட்டம்" : "Jurisdiction & State"}
                </span>
                <span className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  {isTa ? "தமிழ்நாடு, திருநெல்வேலி மாவட்டம்" : "Tirunelveli, Tamil Nadu, India"}
                </span>
              </div>
            </div>
          </div>

          {/* Authenticity Guarantee Callout */}
          <div className="p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/75 border border-emerald-200/70 dark:border-emerald-700/60 flex items-start gap-3.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100 font-tamil">
                {isTa ? "வாசகர்களுக்கான உத்தரவாதம்" : "Transparency & Customer Assurance"}
              </h3>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 font-tamil leading-relaxed">
                {isTa
                  ? "மேதகு களஞ்சியம் இந்திய சட்ட விதிகளுக்கு உட்பட்டு, வெளிப்படைத்தன்மையுடன் நூல்களை விநியோகம் செய்யும் அரசால் அங்கீகரிக்கப்பட்ட நூலக அமைப்பாகும். நீங்கள் செலுத்தும் கட்டணம் மற்றும் ஆர்டர்கள் பாதுகாப்பானவை."
                  : "Methagu Kalanjiyam operates with full legal transparency under the Ministry of MSME. All customer orders, online payments, and speed-post dispatches are backed by official enterprise credentials."}
              </p>
            </div>
          </div>

          {/* Contact Verification Strip */}
          <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-300 font-tamil">
                  {isTa ? "சான்றிதழ் மற்றும் வணிக விசாரணைகளுக்கு" : "Enterprise Verification Inquiries"}
                </p>
                <p className="text-sm font-bold text-white font-mono">WhatsApp எண் : 6384654946 (+91 63846 54946)</p>
              </div>
            </div>

            <a
              href="tel:+916384654946"
              className="px-4 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold font-tamil transition-all min-h-[44px] flex items-center justify-center"
            >
              {isTa ? "நேரடித் தொடர்பு" : "Call Registry Desk"}
            </a>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold transition-all shadow-md min-h-[44px]"
            >
              <span>{isTa ? "நூல்களைத் தேர்வு செய்க" : "Browse Book Catalog"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/terms"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#555555] dark:text-zinc-300 hover:text-[#0A6847] dark:hover:text-emerald-400 transition-colors min-h-[44px]"
            >
              <FileText className="h-4 w-4" />
              <span>{isTa ? "விதிமுறைகள் மற்றும் அஞ்சல் கொள்கை" : "Terms & Delivery Policy"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Enlarged Zoom Modal (Natural aspect ratio with scrollable backdrop) */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full my-auto flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Bar */}
            <div className="w-full flex justify-end pb-2">
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                aria-label={isTa ? "மூடுக" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Natural Aspect Ratio Document */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-white p-2 sm:p-4">
              <Image
                src="/images/brand/certificate-seal.webp"
                alt="Certificate full view"
                width={848}
                height={1200}
                className="w-full h-auto block object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

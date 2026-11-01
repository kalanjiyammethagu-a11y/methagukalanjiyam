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
  ShieldCheck,
  Building,
  Download,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/context/LanguageContext";

export default function CertificatePage() {
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
  }, [zoomOpen]);

  return (
    <div className="min-h-screen pb-24">
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight font-tamil leading-tight">
            {isTa ? "மேதகு களஞ்சியம் பதிவுச் சான்றிதழ்" : "Official Registration Certificate"}
          </h1>
          <p className="text-sm sm:text-base text-[#444444] font-tamil leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியம் இந்திய அரசின் எம்.எஸ்.எம்.இ (MSME) துறையின் கீழ் முறையாகப் பதிவு செய்யப்பட்ட சட்டப்பூர்வமான தமிழ் நூல் சேவை நிறுவனம்."
              : "Methagu Kalanjiyam is legally registered with the Ministry of MSME, Government of India, ensuring verified professional service."}
          </p>
        </div>

        {/* Certificate Display Card */}
        <div className="glass-panel rounded-3xl p-4 sm:p-8 lg:p-10 border border-black/10 bg-white/95 shadow-xl space-y-8">
          
          {/* Certificate Image Frame (Preserves exact 848x1200 natural aspect ratio, no stretching) */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="relative rounded-2xl overflow-hidden border border-black/12 shadow-lg bg-white p-2 sm:p-3 transition-transform duration-300 group-hover:shadow-xl">
              
              {/* Natural aspect ratio image */}
              <div className="relative w-full overflow-hidden rounded-xl bg-neutral-50 cursor-pointer" onClick={() => setZoomOpen(true)}>
                <Image
                  src="/images/brand/certificate-seal.webp"
                  alt={isTa ? "மேதகு களஞ்சியம் பதிவுச் சான்றிதழ்" : "Methagu Kalanjiyam Official Certificate"}
                  width={848}
                  height={1200}
                  className="w-full h-auto block object-contain"
                  priority
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 rounded-xl bg-black/80 text-white font-tamil text-xs font-bold flex items-center gap-2 shadow-lg">
                    <ZoomIn className="h-4 w-4 text-emerald-400" />
                    <span>{isTa ? "பெரிதாக்க அழுத்தவும்" : "Click to Enlarge"}</span>
                  </div>
                </div>
              </div>

              {/* Verified Ribbon Top Right */}
              <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0A6847] text-white shadow-md flex items-center gap-1.5 font-tamil">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isTa ? "சரிபார்க்கப்பட்டது" : "Verified MSME"}
                </span>
              </div>
            </div>

            {/* Quick Actions Under Certificate */}
            <div className="mt-3 flex items-center justify-between px-2 text-xs text-[#666666] font-tamil">
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                className="inline-flex items-center gap-1.5 font-semibold text-[#0A6847] hover:underline cursor-pointer min-h-[36px]"
              >
                <ZoomIn className="h-3.5 w-3.5" />
                <span>{isTa ? "முழுத் தோற்றத்தில் பார்க்க" : "View Full Resolution"}</span>
              </button>

              <a
                href="/images/brand/certificate-seal.webp"
                download="Methagu-Kalanjiyam-MSME-Certificate.webp"
                className="inline-flex items-center gap-1.5 font-semibold text-[#555555] hover:text-[#111111] min-h-[36px]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isTa ? "பதிவிறக்குக" : "Download"}</span>
              </a>

              <a
                href="https://udyamregistration.gov.in/Government-India/Ministry-MSME-registration.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#0A6847] hover:underline min-h-[36px]"
              >
                <Image src="/images/ui/redirect-external.webp" alt="External link" width={14} height={14} className="inline-block" />
                <span>{isTa ? "அரசு இணையதளத்தில் சரிபார்க்க" : "Verify on Govt Portal"}</span>
              </a>
            </div>
          </div>

          {/* Registration Key Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-black/8">
            <div className="p-4 rounded-xl bg-black/3 border border-black/5 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] font-tamil flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-[#0A6847]" />
                {isTa ? "நிறுவனப் பெயர்" : "Organization Name"}
              </span>
              <p className="text-base font-bold text-[#111111] font-tamil">
                {isTa ? "மேதகு களஞ்சியம்" : "Methagu Kalanjiyam"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/3 border border-black/5 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] font-tamil flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[#0A6847]" />
                {isTa ? "உத்யம் பதிவு எண்" : "Udyam Registration Number"}
              </span>
              <p className="text-base font-mono font-bold text-[#0A6847]">
                UDYAM-TN-18-0101323
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/3 border border-black/5 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] font-tamil">
                {isTa ? "அதிகாரப்பூர்வ தொடர்பு எண்" : "Official Helpline"}
              </span>
              <a
                href="tel:+918248654946"
                className="text-sm font-bold text-[#111111] hover:text-[#0A6847] flex items-center gap-1.5 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-[#0A6847]" />
                <span>+91 82486 54946</span>
              </a>
            </div>

            <div className="p-4 rounded-xl bg-black/3 border border-black/5 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] font-tamil">
                {isTa ? "மின்னஞ்சல் முகவரி" : "Official Email"}
              </span>
              <a
                href="mailto:methagukalanjiyam@gmail.com"
                className="text-sm font-bold text-[#111111] hover:text-[#0A6847] flex items-center gap-1.5 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-[#0A6847]" />
                <span>methagukalanjiyam@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Three Pillars of Trust */}
          <div className="space-y-4 pt-4 border-t border-black/8">
            <h3 className="text-base font-bold text-[#111111] font-tamil">
              {isTa ? "எங்களின் தொழில்முறை உறுதிமொழி" : "Our Commitment & Standards"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0A6847]/5 border border-[#0A6847]/15 space-y-1.5">
                <h4 className="text-xs font-bold text-[#0A6847] font-tamil">
                  {isTa ? "1. அரசு அங்கீகாரம்" : "1. Government Registered"}
                </h4>
                <p className="text-xs text-[#444444] font-tamil leading-relaxed">
                  {isTa
                    ? "மத்திய அரசின் எம்.எஸ்.எம்.இ கீழ் பதிவு பெற்ற சட்டப்பூர்வமான நிறுவனம்."
                    : "Fully registered and recognized under the Ministry of MSME, Govt. of India."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A6847]/5 border border-[#0A6847]/15 space-y-1.5">
                <h4 className="text-xs font-bold text-[#0A6847] font-tamil">
                  {isTa ? "2. தொழில்முறைப் பாதுகாப்பு" : "2. Secure Transactions"}
                </h4>
                <p className="text-xs text-[#444444] font-tamil leading-relaxed">
                  {isTa
                    ? "அரசாங்க விதிமுறைகளைப் பின்பற்றி இயங்குவதால், உங்கள் வணிகப் பரிவர்த்தனைகள் அனைத்தும் பாதுகாப்பானவை."
                    : "Strict adherence to commerce regulations ensures complete customer safety."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A6847]/5 border border-[#0A6847]/15 space-y-1.5">
                <h4 className="text-xs font-bold text-[#0A6847] font-tamil">
                  {isTa ? "3. உலகளாவிய விநியோகம்" : "3. Safe Delivery"}
                </h4>
                <p className="text-xs text-[#444444] font-tamil leading-relaxed">
                  {isTa
                    ? "இந்தியா போஸ்ட் & எஸ்டி கூரியர் வழியாக முறையான கண்காணிப்புடன் நூல்கள் அனுப்பப்படுகின்றன."
                    : "Tracked dispatch through India Post and ST Courier with real-time AWB updates."}
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-black/8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold transition-all shadow-md min-h-[44px]"
            >
              <span>{isTa ? "நூல்களைத் தேர்வு செய்க" : "Browse Book Catalog"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/terms"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#555555] hover:text-[#0A6847] transition-colors min-h-[44px]"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
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

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { RotateCcw, Phone, MessageCircle } from "lucide-react";
import { PostalSealIcon, ArchivalWaxSealIcon } from "@/components/ui/Icons";
import { useLanguage } from "@/context/LanguageContext";
import {
  DISPLAY_PHONE,
  DISPLAY_WHATSAPP_LABEL_EN,
  DISPLAY_WHATSAPP_LABEL_TA,
  WHATSAPP_NUMBER,
} from "@/lib/whatsapp";

export function Footer() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  // If on admin routes, let the dedicated admin layout render instead
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="mt-20 border-t border-black/8 dark:border-white/10 bg-[#F5F3EF]/90 dark:bg-[#18181B]/95 backdrop-blur-xl">
      {/* Trust Badges */}
      <div className="border-b border-black/8 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 dark:bg-emerald-500/15 flex items-center justify-center text-[#0A6847] dark:text-emerald-400 shrink-0">
                <PostalSealIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  {isTa ? "விரைவான அஞ்சல் சேவை" : "Fast Courier & Postal Dispatch"}
                </h4>
                <p className="text-xs text-[#444444] dark:text-zinc-300 mt-0.5 font-medium">
                  {isTa
                    ? "ST கூரியர் & இந்திய அஞ்சல் வழியாக பாதுகாப்பான வழங்கல்"
                    : "Trusted delivery across India via ST Courier & India Post"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 dark:bg-emerald-500/15 flex items-center justify-center text-[#0A6847] dark:text-emerald-400 shrink-0">
                <ArchivalWaxSealIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  {isTa ? "உண்மையான அரிய ஆவணங்கள்" : "Authentic Archival Volumes"}
                </h4>
                <p className="text-xs text-[#444444] dark:text-zinc-300 mt-0.5 font-medium">
                  {isTa ? "சரிபார்க்கப்பட்ட வரலாற்று பதிப்பக நூல்கள்" : "Verified primary-source historical editions"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 dark:bg-emerald-500/15 flex items-center justify-center text-[#0A6847] dark:text-emerald-400 shrink-0">
                <RotateCcw className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  {isTa ? "நேரடி உதவி & கண்காணிப்பு" : "Direct Support & Tracking"}
                </h4>
                <p className="text-xs text-[#444444] dark:text-zinc-300 mt-0.5 font-medium">
                  {isTa
                    ? "WhatsApp வழியாக உடனடி AWB டிராக்கிங் வசதி"
                    : "Instant AWB dispatch updates via WhatsApp"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border border-black/12 shadow-xs bg-white shrink-0">
                <Image
                  src="/icons/favicon.png"
                  alt="மேதகு களஞ்சியம்"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-base font-tamil text-[#191614] dark:text-zinc-100">
                {isTa ? "மேதகு களஞ்சியம்" : "Methagu Kalanjiyam"}
              </span>
            </div>
            <p className="text-xs text-[#4A443E] dark:text-zinc-300 leading-relaxed font-tamil font-medium">
              {isTa
                ? "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம்."
                : "Preserving rare Tamil literature, liberation movement records, and historical archives."}
            </p>
            <div className="space-y-1">
              <a
                href={`tel:${DISPLAY_PHONE.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2.5 text-xs font-bold text-[#191614] dark:text-zinc-100 hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors min-h-[36px]"
                aria-label={`Call ${DISPLAY_PHONE}`}
              >
                <Phone className="h-4 w-4 text-[#0D5C3A] dark:text-emerald-400" aria-hidden="true" />
                <span>{DISPLAY_PHONE}</span>
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs font-bold text-[#0D5C3A] dark:text-emerald-400 hover:underline transition-colors min-h-[36px] font-tamil"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{isTa ? DISPLAY_WHATSAPP_LABEL_TA : DISPLAY_WHATSAPP_LABEL_EN}</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#191614] dark:text-zinc-100">
              {isTa ? "பிரிவுகள்" : "Collections"}
            </h5>
            <ul className="space-y-1 text-xs text-[#2B2723] dark:text-zinc-300 font-medium">
              <li>
                <Link href="/books?category=history" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "வரலாறு & ஆவணங்கள்" : "History & Archives"}
                </Link>
              </li>
              <li>
                <Link href="/books?category=archives" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "அரிய ஆவணத் தொகுப்புகள்" : "Rare Archival Volumes"}
                </Link>
              </li>
              <li>
                <Link href="/books?category=biographies" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "தலைவர்கள் & வாழ்க்கை வரலாறு" : "Leaders & Biographies"}
                </Link>
              </li>
              <li>
                <Link href="/books?category=memoirs" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "நினைவுக் குறிப்புகள்" : "Memoirs"}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "களஞ்சியப் பதிவுகள்" : "Articles & News"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Organization */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#191614] dark:text-zinc-100">
              {isTa ? "நிறுவனம்" : "Organization"}
            </h5>
            <ul className="space-y-1 text-xs text-[#2B2723] dark:text-zinc-300 font-medium">
              <li>
                <Link href="/supporters" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "ஆதரவாளர்கள்" : "Supporters & Patrons"}
                </Link>
              </li>
              <li>
                <Link href="/certificate" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "பதிவுச் சான்றிதழ்" : "MSME Certificate"}
                </Link>
              </li>
              <li>
                <Link href="/videos" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "காணொளி ஆவணங்கள்" : "Video Archives"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#191614] dark:text-zinc-100">
              {isTa ? "கொள்கைகள்" : "Policies"}
            </h5>
            <ul className="space-y-1 text-xs text-[#2B2723] dark:text-zinc-300 font-medium">
              <li>
                <Link href="/privacy" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "தனியுரிமைக் கொள்கை (Privacy)" : "Privacy Policy"}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  {isTa ? "விதிமுறைகள் & நிபந்தனைகள் (Terms)" : "Terms & Conditions"}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-black/8 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#4A443E] dark:text-zinc-300">
          <p>
            © {new Date().getFullYear()} methagukalanjiyam.in.{" "}
            {isTa ? "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை." : "All rights reserved."}
          </p>
          <p className="flex items-center gap-1.5 font-tamil">
            <span>{isTa ? "தமிழுக்கும் தமிழினத்திற்கும் சமர்ப்பணம்" : "Dedicated to Tamil Heritage & Historical Truth"}</span>
            <ArchivalWaxSealIcon className="h-3.5 w-3.5 text-[#0D5C3A] dark:text-emerald-400" aria-hidden="true" />
          </p>
        </div>
      </div>
    </footer>
  );
}

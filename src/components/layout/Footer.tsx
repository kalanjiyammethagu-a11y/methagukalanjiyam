"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { RotateCcw, Phone } from "lucide-react";
import { PostalSealIcon, ArchivalWaxSealIcon } from "@/components/ui/Icons";

export function Footer() {
  const pathname = usePathname();

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
                  விரைவான அஞ்சல் சேவை
                </h4>
                <p className="text-xs text-[#444444] dark:text-zinc-300 mt-0.5 font-medium">
                  ST கூரியர் & இந்திய அஞ்சல் வழியாக பாதுகாப்பான வழங்கல்
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 dark:bg-emerald-500/15 flex items-center justify-center text-[#0A6847] dark:text-emerald-400 shrink-0">
                <ArchivalWaxSealIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  உண்மையான அரிய ஆவணங்கள்
                </h4>
                <p className="text-xs text-[#444444] dark:text-zinc-300 mt-0.5 font-medium">
                  சரிபார்க்கப்பட்ட வரலாற்று பதிப்பக நூல்கள்
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 dark:bg-emerald-500/15 flex items-center justify-center text-[#0A6847] dark:text-emerald-400 shrink-0">
                <RotateCcw className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  நேரடி உதவி & கண்காணிப்பு
                </h4>
                <p className="text-xs text-[#444444] dark:text-zinc-300 mt-0.5 font-medium">
                  WhatsApp வழியாக உடனடி AWB டிராக்கிங் வசதி
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
                மேதகு களஞ்சியம்
              </span>
            </div>
            <p className="text-xs text-[#4A443E] dark:text-zinc-300 leading-relaxed font-tamil font-medium">
              தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம்.
            </p>
            <div>
              <a
                href="tel:+918248654946"
                className="inline-flex items-center gap-2.5 text-xs font-bold text-[#191614] dark:text-zinc-100 hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors min-h-[44px]"
                aria-label="Call +91 82486 54946"
              >
                <Phone className="h-4 w-4 text-[#0D5C3A] dark:text-emerald-400" aria-hidden="true" />
                <span>+91 82486 54946</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#191614] dark:text-zinc-100">
              பிரிவுகள்
            </h5>
            <ul className="space-y-1 text-xs text-[#2B2723] dark:text-zinc-300 font-medium">
              <li>
                <Link href="/books?category=history" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  வரலாறு & ஆவணங்கள்
                </Link>
              </li>
              <li>
                <Link href="/books?category=archives" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  அரிய ஆவணத் தொகுப்புகள்
                </Link>
              </li>
              <li>
                <Link href="/books?category=biographies" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  தலைவர்கள் & வாழ்க்கை வரலாறு
                </Link>
              </li>
              <li>
                <Link href="/books?category=memoirs" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  நினைவுக் குறிப்புகள்
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  களஞ்சியப் பதிவுகள்
                </Link>
              </li>
            </ul>
          </div>

          {/* Organization */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#191614] dark:text-zinc-100">
              நிறுவனம்
            </h5>
            <ul className="space-y-1 text-xs text-[#2B2723] dark:text-zinc-300 font-medium">
              <li>
                <Link href="/supporters" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  ஆதரவாளர்கள்
                </Link>
              </li>
              <li>
                <Link href="/certificate" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  பதிவுச் சான்றிதழ்
                </Link>
              </li>
              <li>
                <Link href="/videos" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  காணொளி ஆவணங்கள்
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#191614] dark:text-zinc-100">
              கொள்கைகள்
            </h5>
            <ul className="space-y-1 text-xs text-[#2B2723] dark:text-zinc-300 font-medium">
              <li>
                <Link href="/privacy" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  தனியுரிமைக் கொள்கை (Privacy)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#0D5C3A] dark:hover:text-emerald-400 transition-colors py-1.5 block">
                  விதிமுறைகள் & நிபந்தனைகள் (Terms)
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-black/8 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#4A443E] dark:text-zinc-300">
          <p>© {new Date().getFullYear()} methagukalanjiyam.in. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.</p>
          <p className="flex items-center gap-1.5 font-tamil">
            <span>தமிழுக்கும் தமிழினத்திற்கும் சமர்ப்பணம்</span>
            <ArchivalWaxSealIcon className="h-3.5 w-3.5 text-[#0D5C3A] dark:text-emerald-400" aria-hidden="true" />
          </p>
        </div>
      </div>
    </footer>
  );
}

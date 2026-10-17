import * as React from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, Truck, RotateCcw, Heart, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/8 bg-[#F5F3EF]/60 backdrop-blur-xl">
      {/* Trust Badges */}
      <div className="border-b border-black/6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 flex items-center justify-center text-[#0A6847] shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#111111] font-tamil">
                  விரைவான தபால் சேவை
                </h4>
                <p className="text-xs text-[#666666] mt-0.5">
                  ST Courier & India Post வழியாக பாதுகாப்பான டெலிவரி
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 flex items-center justify-center text-[#0A6847] shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#111111] font-tamil">
                  உண்மையான அரிய ஆவணங்கள்
                </h4>
                <p className="text-xs text-[#666666] mt-0.5">
                  சரிபார்க்கப்பட்ட வரலாற்று பதிப்பக நூல்கள்
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-12 w-12 rounded-2xl bg-[#0A6847]/10 flex items-center justify-center text-[#0A6847] shrink-0">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#111111] font-tamil">
                  நேரடி உதவி & கண்காணிப்பு
                </h4>
                <p className="text-xs text-[#666666] mt-0.5">
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
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#0A6847] flex items-center justify-center text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-bold text-base font-tamil text-[#111111]">
                மெதகு களஞ்சியம்
              </span>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed font-tamil">
              தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், தேசிய ஆவணங்கள் மற்றும் அரிய தமிழ் இலக்கியப் பெட்டகம்.
            </p>
            <div className="flex items-center gap-3 text-xs text-[#555555]">
              <Phone className="h-3.5 w-3.5 text-[#0A6847]" />
              <span>+91 82486 54946</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              பிரிவுகள்
            </h5>
            <ul className="space-y-2 text-xs text-[#666666]">
              <li>
                <Link href="/books?category=history" className="hover:text-[#0A6847] transition-colors">
                  வரலாறு & ஆவணங்கள்
                </Link>
              </li>
              <li>
                <Link href="/books?category=literature" className="hover:text-[#0A6847] transition-colors">
                  தமிழ் நாவல்கள் & கவிதைகள்
                </Link>
              </li>
              <li>
                <Link href="/books?category=biography" className="hover:text-[#0A6847] transition-colors">
                  தலைவர்கள் & வாழ்க்கை வரலாறு
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#0A6847] transition-colors">
                  களஞ்சியப் பதிவுகள்
                </Link>
              </li>
            </ul>
          </div>

          {/* Organization */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              நிறுவனம்
            </h5>
            <ul className="space-y-2 text-xs text-[#666666]">
              <li>
                <Link href="/supporters" className="hover:text-[#0A6847] transition-colors">
                  ஆதரவாளர்கள்
                </Link>
              </li>
              <li>
                <Link href="/certificate" className="hover:text-[#0A6847] transition-colors">
                  பதிவுச் சான்றிதழ்
                </Link>
              </li>
              <li>
                <Link href="/videos" className="hover:text-[#0A6847] transition-colors">
                  வீடியோ ஆவணங்கள்
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#0A6847] transition-colors">
                  நிர்வாகி உள்நுழைவு (Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3 font-tamil">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              கொள்கைகள்
            </h5>
            <ul className="space-y-2 text-xs text-[#666666]">
              <li>
                <Link href="/privacy" className="hover:text-[#0A6847] transition-colors">
                  தனியுரிமைக் கொள்கை (Privacy)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#0A6847] transition-colors">
                  விதிமுறைகள் & நிபந்தனைகள் (Terms)
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-black/8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#888888]">
          <p>© {new Date().getFullYear()} methagukalanjiyam.in. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.</p>
          <p className="flex items-center gap-1 font-tamil">
            தமிழுக்கும் தமிழினத்திற்கும் சமர்ப்பணம் <Heart className="h-3 w-3 text-rose-600 fill-rose-600" />
          </p>
        </div>
      </div>
    </footer>
  );
}

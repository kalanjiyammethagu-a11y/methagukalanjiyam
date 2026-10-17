"use client";

import * as React from "react";
import Link from "next/link";
import { X, BookOpen, Newspaper, Video, Heart, Award, Shield, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  locale: "ta" | "en";
  onToggleLocale: () => void;
}

export function MobileNav({
  isOpen,
  onClose,
  locale,
  onToggleLocale,
}: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xs h-full bg-[#FAFAF9]/95 backdrop-blur-2xl border-l border-white/60 p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#0A6847] flex items-center justify-center text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm font-tamil text-[#111111]">
                மெதகு களஞ்சியம்
              </span>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[#555555] hover:bg-black/5"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-1.5 font-tamil">
            <Link
              href="/books"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#222222] hover:bg-[#0A6847]/10 hover:text-[#0A6847] transition-colors"
            >
              <BookOpen className="h-4 w-4 text-[#0A6847]" />
              <span>{locale === "ta" ? "நூல்கள்" : "Books Catalog"}</span>
            </Link>
            <Link
              href="/blog"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#222222] hover:bg-[#0A6847]/10 hover:text-[#0A6847] transition-colors"
            >
              <Newspaper className="h-4 w-4 text-[#0A6847]" />
              <span>{locale === "ta" ? "களஞ்சியப் பதிவுகள்" : "Articles & Stories"}</span>
            </Link>
            <Link
              href="/videos"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#222222] hover:bg-[#0A6847]/10 hover:text-[#0A6847] transition-colors"
            >
              <Video className="h-4 w-4 text-[#0A6847]" />
              <span>{locale === "ta" ? "வீடியோ ஆவணங்கள்" : "Video Archives"}</span>
            </Link>
            <Link
              href="/supporters"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#222222] hover:bg-[#0A6847]/10 hover:text-[#0A6847] transition-colors"
            >
              <Heart className="h-4 w-4 text-[#0A6847]" />
              <span>{locale === "ta" ? "ஆதரவாளர்கள்" : "Our Patrons"}</span>
            </Link>
            <Link
              href="/certificate"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#222222] hover:bg-[#0A6847]/10 hover:text-[#0A6847] transition-colors"
            >
              <Award className="h-4 w-4 text-[#0A6847]" />
              <span>{locale === "ta" ? "நிறுவனச் சான்றிதழ்" : "Certificate"}</span>
            </Link>
          </nav>
        </div>

        {/* Footer info & Login */}
        <div className="pt-6 border-t border-black/8 space-y-3">
          <Button
            variant="glass"
            className="w-full justify-center"
            onClick={onToggleLocale}
          >
            <Globe className="h-4 w-4 text-[#0A6847]" />
            <span>{locale === "ta" ? "English மொழியில் காண்க" : "தமிழுக்கு மாறு"}</span>
          </Button>

          <Link href="/login" onClick={onClose} className="block">
            <Button variant="primary" className="w-full justify-center">
              <User className="h-4 w-4" />
              <span>{locale === "ta" ? "உள்நுழை / கணக்கு" : "Login / Account"}</span>
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

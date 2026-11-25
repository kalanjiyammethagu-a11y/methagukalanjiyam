"use client";

import * as React from "react";
import Image from "next/image";
import { MessageCircle, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import { localized } from "@/lib/i18n";

export interface SupporterData {
  id: string;
  nameTa: string;
  nameEn: string;
  roleTa: string;
  roleEn: string;
  image: string;
  photoAltTa?: string;
  photoAltEn?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  badge?: string;
}

interface SupporterCardProps {
  supporter: SupporterData;
  locale?: "ta" | "en";
  className?: string;
}

export function SupporterCard({
  supporter,
  locale = "ta",
  className,
}: SupporterCardProps) {
  const name = localized(supporter, "name", locale);
  const role = localized(supporter, "role", locale);
  const photoAlt = localized(supporter, "photoAlt", locale, name);
  const imageSrc =
    supporter.image.startsWith("http") || supporter.image.startsWith("/")
      ? supporter.image
      : `/${supporter.image}`;

  return (
    <div
      className={cn(
        "group relative glass-panel rounded-2xl p-6 text-center border border-black/10 hover:border-[#0A6847]/40 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-between bg-white/70",
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4 w-full">
        {/* Avatar with decorative ring */}
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-2 border-[#0A6847]/20 p-1 bg-white shadow-md group-hover:scale-105 group-hover:border-[#0A6847] transition-all duration-300">
          <div className="relative h-full w-full rounded-full overflow-hidden bg-black/5">
            <Image
              src={imageSrc}
              alt={photoAlt}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Identity Details */}
        <div className="space-y-1.5 w-full">
          <h3 className="text-base sm:text-lg font-bold text-[#111111] group-hover:text-[#0A6847] transition-colors font-tamil leading-snug">
            {name}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-[#444444] font-tamil leading-relaxed line-clamp-2 px-1">
            {role}
          </p>
        </div>
      </div>

      {/* Social and Contact Action Links */}
      <div className="pt-4 mt-4 border-t border-black/8 w-full flex items-center justify-center gap-3">
        {supporter.instagramUrl && (
          <a
            href={supporter.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} — Instagram`}
            className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xs"
          >
            <Instagram className="h-5 w-5" />
          </a>
        )}

        {supporter.whatsappUrl && (
          <a
            href={supporter.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} — WhatsApp`}
            className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xs"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}

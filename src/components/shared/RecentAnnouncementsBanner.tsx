"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { AnnouncementItem } from "@/lib/announcements";

interface RecentAnnouncementsBannerProps {
  announcements: AnnouncementItem[];
  className?: string;
}

export function RecentAnnouncementsBanner({
  announcements,
  className = "",
}: RecentAnnouncementsBannerProps) {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  if (!announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div
      className={`glass-panel rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-gradient-to-br from-[#0A6847]/8 via-[#0A6847]/4 to-transparent dark:from-emerald-950/60 dark:via-emerald-950/30 dark:to-transparent shadow-xs ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-4 text-[#0A6847] dark:text-emerald-400">
        <Bell className="h-5 w-5 animate-pulse shrink-0" />
        <h2 className="text-sm sm:text-base font-bold font-tamil tracking-wide text-[#0A6847] dark:text-emerald-300">
          {isTa ? "சமீபத்திய அறிவிப்புகள்" : "Recent Announcements"}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {announcements.map((item, idx) => {
          const cardContent = (
            <>
              <span className="text-[11px] font-bold text-[#0A6847] dark:text-emerald-400 font-tamil block">
                {isTa ? item.dateLabelTa : item.dateLabelEn}
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil leading-snug">
                {isTa ? item.titleTa : item.titleEn}
              </h3>
              <p className="text-xs text-[#555555] dark:text-zinc-300 font-tamil line-clamp-2 leading-relaxed">
                {isTa ? item.descTa : item.descEn}
              </p>
            </>
          );

          if (item.linkUrl) {
            const isExternal = item.linkUrl.startsWith("http");
            return isExternal ? (
              <a
                key={item.id || idx}
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-white/85 dark:bg-zinc-900/90 border border-black/8 dark:border-white/10 hover:border-[#0A6847]/40 shadow-2xs space-y-1.5 transition-all block"
              >
                {cardContent}
              </a>
            ) : (
              <Link
                key={item.id || idx}
                href={item.linkUrl}
                className="p-4 rounded-2xl bg-white/85 dark:bg-zinc-900/90 border border-black/8 dark:border-white/10 hover:border-[#0A6847]/40 shadow-2xs space-y-1.5 transition-all block"
              >
                {cardContent}
              </Link>
            );
          }

          return (
            <div
              key={item.id || idx}
              className="p-4 rounded-2xl bg-white/85 dark:bg-zinc-900/90 border border-black/8 dark:border-white/10 shadow-2xs space-y-1.5"
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}

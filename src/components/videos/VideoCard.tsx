"use client";

import * as React from "react";
import Image from "next/image";
import { Play, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export interface VideoData {
  id: string;
  titleTa: string;
  titleEn: string;
  descriptionTa: string;
  descriptionEn: string;
  embedUrl: string;
  posterImage: string;
  categoryTa: string;
  categoryEn: string;
  duration?: string;
  publishedDate?: string;
}

interface VideoCardProps {
  video: VideoData;
  locale?: "ta" | "en";
  onPlay?: (video: VideoData) => void;
  className?: string;
}

export function VideoCard({
  video,
  locale = "ta",
  onPlay,
  className,
}: VideoCardProps) {
  const isTa = locale === "ta";
  const title = isTa ? video.titleTa : video.titleEn;
  const description = isTa ? video.descriptionTa : video.descriptionEn;
  const category = isTa ? video.categoryTa : video.categoryEn;

  const handlePlay = () => {
    if (onPlay) {
      onPlay(video);
    }
  };

  return (
    <article
      className={cn(
        "group relative glass-panel rounded-2xl overflow-hidden border border-black/10 hover:border-[#0A6847]/40 transition-all duration-300 hover:shadow-lg flex flex-col h-full bg-white/70",
        className
      )}
    >
      {/* Video Thumbnail with Play Button Overlay */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-black/80 cursor-pointer"
        onClick={handlePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePlay();
          }
        }}
        aria-label={`${isTa ? "காணொளியை இயக்குக" : "Play video"}: ${title}`}
      >
        <Image
          src={video.posterImage.startsWith("/") ? video.posterImage : `/${video.posterImage}`}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
        />

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/60 transition-colors" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <Badge variant="glass" size="sm" className="font-tamil bg-black/60 text-white border-white/20 backdrop-blur-md">
            {category}
          </Badge>
          {video.duration && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-black/75 text-white/90 backdrop-blur-md flex items-center gap-1">
              <Clock className="h-3 w-3 text-emerald-400" />
              {video.duration}
            </span>
          )}
        </div>

        {/* Centered Play Button (Fitts's Law 56px circle) */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="h-14 w-14 rounded-full bg-white/95 text-[#0A6847] shadow-xl flex items-center justify-center transform group-hover:scale-110 group-active:scale-95 transition-all duration-300">
            <Play className="h-6 w-6 ml-1 fill-[#0A6847]" />
          </div>
        </div>

        {/* Bottom indicator text */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 pointer-events-none">
          <p className="text-[11px] font-medium text-white/80 line-clamp-1 font-tamil">
            {isTa ? "காணொளியைத் திறக்க அழுத்தவும்" : "Click to watch video"}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-[#111111] group-hover:text-[#0A6847] transition-colors leading-snug line-clamp-2 font-tamil">
            {title}
          </h3>
          <p className="text-xs text-[#555555] leading-relaxed line-clamp-2 font-tamil">
            {description}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-black/8 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] hover:underline min-h-[44px]"
          >
            <span>{isTa ? "காணொளியைக் காண்க" : "Watch Now"}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          {video.publishedDate && (
            <span className="text-[11px] text-[#777777] font-medium">
              {video.publishedDate}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

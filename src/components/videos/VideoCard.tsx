"use client";

import * as React from "react";
import Image from "next/image";
import { Play, Clock, Maximize2, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { localized } from "@/lib/i18n";

export interface VideoData {
  id: string;
  titleTa: string;
  titleEn: string;
  descriptionTa: string;
  descriptionEn: string;
  embedUrl: string;
  videoUrl?: string;
  posterImage: string;
  posterAltTa?: string;
  posterAltEn?: string;
  categoryTa: string;
  categoryEn: string;
  duration?: string;
  publishedDate?: string;
}

export interface VideoCardProps {
  video: VideoData;
  locale?: "ta" | "en";
  isPlaying?: boolean;
  onPlay?: (video: VideoData) => void;
  onStop?: () => void;
  onExpand?: (video: VideoData) => void;
  className?: string;
}

function getAutoplayUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("autoplay", "true");
    u.searchParams.set("muted", "0");
    u.searchParams.set("playsinline", "1");
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}autoplay=true&muted=0&playsinline=1`;
  }
}

export function VideoCard({
  video,
  locale = "ta",
  isPlaying = false,
  onPlay,
  onStop,
  onExpand,
  className,
}: VideoCardProps) {
  const isTa = locale === "ta";
  const title = localized(video, "title", locale);
  const description = localized(video, "description", locale);
  const category = localized(video, "category", locale);

  const cardRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (isPlaying && cardRef.current) {
      // Smoothly scroll the video card into center view when playback starts
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isPlaying]);

  const handlePlay = () => {
    if (onPlay) {
      onPlay(video);
    }
  };

  const autoplaySrc = React.useMemo(() => {
    return isPlaying ? getAutoplayUrl(video.embedUrl) : video.embedUrl;
  }, [isPlaying, video.embedUrl]);

  return (
    <article
      ref={cardRef}
      className={cn(
        "group relative glass-panel rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col h-full bg-white/80",
        isPlaying
          ? "border-[#0A6847] shadow-xl ring-2 ring-[#0A6847]/30"
          : "border-black/10 hover:border-[#0A6847]/40 hover:shadow-lg",
        className
      )}
      data-video-id={video.id}
    >
      {/* Video Media Container: In-feed Iframe/Video when playing, Poster thumbnail when paused */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/90">
        {isPlaying ? (
          <div className="relative w-full h-full">
            {video.videoUrl ? (
              <video
                src={video.videoUrl}
                controls
                autoPlay
                playsInline
                poster={
                  video.posterImage.startsWith("http") || video.posterImage.startsWith("/")
                    ? video.posterImage
                    : `/${video.posterImage}`
                }
                className="absolute inset-0 w-full h-full object-contain bg-black z-10"
              />
            ) : (
              <iframe
                src={autoplaySrc}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0 z-10"
              />
            )}
            {/* Top-Right Control Overlays */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 pointer-events-auto">
              {onExpand && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand(video);
                  }}
                  className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label={isTa ? "பெரிய திரை வடிவில் காண்க" : "Open in full theater mode"}
                  title={isTa ? "பெரிய திரை" : "Full Theater Mode"}
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}
              {onStop && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStop();
                  }}
                  className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label={isTa ? "காணொளியை நிறுத்துக" : "Stop video playback"}
                  title={isTa ? "நிறுத்துக" : "Stop"}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className="relative w-full h-full cursor-pointer select-none"
            onClick={handlePlay}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePlay();
              }
            }}
            aria-label={`${isTa ? "காணொளியை இயக்குக" : "Play video in feed"}: ${title}`}
          >
            <Image
              src={
                video.posterImage.startsWith("http") || video.posterImage.startsWith("/")
                  ? video.posterImage
                  : `/${video.posterImage}`
              }
              alt={localized(video, "posterAlt", locale, title)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
            />

            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent group-hover:from-black/70 transition-colors" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
              <Badge variant="glass" size="sm" className="font-tamil bg-black/70 text-white border-white/20 backdrop-blur-md">
                {category}
              </Badge>
              {video.duration && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-black/80 text-white backdrop-blur-md flex items-center gap-1">
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
              <p className="text-[11px] font-medium text-white/90 line-clamp-1 font-tamil">
                {isTa ? "காணொளியை நேரடியாக இயக்க அழுத்தவும்" : "Click to play directly in feed"}
              </p>
            </div>
          </div>
        )}
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

        {/* Footer Actions */}
        <div className="pt-3 mt-3 border-t border-black/8 flex items-center justify-between">
          {isPlaying ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors min-h-[44px]"
                aria-label={isTa ? "காணொளியை நிறுத்துக" : "Stop playing"}
              >
                <Square className="h-3.5 w-3.5 fill-red-700" />
                <span>{isTa ? "நிறுத்துக" : "Stop"}</span>
              </button>
              {onExpand && (
                <button
                  type="button"
                  onClick={() => onExpand(video)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-[#333333] text-xs font-semibold transition-colors min-h-[44px]"
                  aria-label={isTa ? "திரைப்படம் வடிவில் காண்க" : "Open in theater modal"}
                >
                  <Maximize2 className="h-3.5 w-3.5 text-[#555555]" />
                  <span>{isTa ? "பெரிய திரை" : "Theater"}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] hover:underline min-h-[44px]"
              >
                <Play className="h-3.5 w-3.5 fill-[#0A6847]" />
                <span>{isTa ? "காணொளியை இயக்குக" : "Play in Feed"}</span>
              </button>

              {onExpand && (
                <button
                  type="button"
                  onClick={() => onExpand(video)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#666666] hover:text-[#111111] hover:underline min-h-[44px] px-1"
                  aria-label={isTa ? "திரைப்படம் வடிவில் காண்க" : "Open in theater modal"}
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>{isTa ? "பெரிய திரை" : "Modal"}</span>
                </button>
              )}
            </div>
          )}

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

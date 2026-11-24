"use client";

import * as React from "react";
import Image from "next/image";
import { Search, Film, X, Play } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryPills, type CategoryOption } from "@/components/ui/CategoryPills";
import { VideoCard, type VideoData } from "@/components/videos/VideoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/context/LanguageContext";
import { allVideos } from "@/data/videos";

const categoryOptions: CategoryOption[] = [
  { slug: "book-showcase", labelTa: "புத்தகக் காணொளி", labelEn: "Book Showcase" },
  { slug: "memorial", labelTa: "நினைவேந்தல்", labelEn: "Memorials" },
  { slug: "history", labelTa: "வரலாற்று ஆவணம்", labelEn: "History" },
  { slug: "tactical", labelTa: "கள ஆவணம்", labelEn: "Tactical" },
  { slug: "overview", labelTa: "அறிமுகம்", labelEn: "Overview" },
];

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

export function VideosCatalogClient() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  // In-feed playback state: ID of the currently playing card in the feed
  const [playingVideoId, setPlayingVideoId] = React.useState<string | null>(null);

  // Optional full theater modal state
  const [modalVideo, setModalVideo] = React.useState<VideoData | null>(null);

  // Filter pipeline
  const filteredVideos = React.useMemo(() => {
    let list = [...allVideos];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.titleTa.toLowerCase().includes(q) ||
          v.titleEn.toLowerCase().includes(q) ||
          v.descriptionTa.toLowerCase().includes(q) ||
          v.descriptionEn.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      const catObj = categoryOptions.find((c) => c.slug === selectedCategory);
      if (catObj) {
        list = list.filter(
          (v) =>
            v.categoryTa.toLowerCase() === catObj.labelTa.toLowerCase() ||
            v.categoryEn.toLowerCase() === catObj.labelEn.toLowerCase()
        );
      }
    }

    return list;
  }, [search, selectedCategory]);

  // Stop playback when category or search changes to prevent hidden audio
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setPlayingVideoId(null);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPlayingVideoId(null);
  };

  // Lock body scroll and close modal on Escape
  React.useEffect(() => {
    if (modalVideo) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setModalVideo(null);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [modalVideo]);

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Top Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "காணொளி ஆவணங்கள்" : "Video Archives" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111111] tracking-tight font-tamil leading-tight">
            {isTa ? "காணொளி ஆவணங்கள்" : "Video Documentaries & Previews"}
          </h1>
          <p className="text-sm sm:text-base text-[#444444] font-tamil max-w-2xl mx-auto leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியத்தின் அரிய வரலாற்று ஆவணங்கள், புத்தக அறிமுகக் காட்சிகள் மற்றும் மாவீரர் நினைவேந்தல் காணொளிகள் நேரடியாக இங்கே காணலாம்."
              : "Rare archival video clips, literary book trailers, and historic documentary footage playable directly in the feed."}
          </p>
        </div>

        {/* Archival Panorama Banner Frame */}
        <div className="relative aspect-[21/9] sm:aspect-[2.6/1] w-full rounded-3xl overflow-hidden border border-black/10 shadow-lg bg-black">
          <Image
            src="/images/brand/banner-video-archive.webp"
            alt={isTa ? "வீடியோ ஆவணங்கள் வரலாற்று பதாகை" : "Archival Video Records Panorama"}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 sm:p-8">
            <div className="text-white space-y-1">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-300 font-bold font-tamil">
                {isTa ? "வரலாற்று ஒலி-ஒளி காப்பகம்" : "Archival Audio-Visual Repository"}
              </span>
              <p className="text-xs sm:text-sm font-tamil text-white/90 max-w-xl">
                {isTa
                  ? "தலைவரின் வரலாற்றுப் பிரகடனங்கள், புத்தக முன்னோட்டங்கள் மற்றும் களத்து நினைவேந்தல் ஆவணங்கள்"
                  : "Preserved speeches, literary monographs, and solemn memorial documentaries from national archives"}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Search + Categories */}
        <div className="space-y-4 pt-4 border-t border-black/8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A6847]" />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={isTa ? "காணொளிகளைத் தேடுக (Search videos)..." : "Search videos..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/12 bg-white/80 text-base sm:text-sm font-tamil text-[#111111] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/40 focus:border-[#0A6847] transition-all min-h-[44px]"
              />
            </div>

            <span className="text-xs font-semibold text-[#555555] font-tamil self-center sm:self-auto">
              {isTa
                ? `${filteredVideos.length} காணொளிகள் கிடைக்கின்றன`
                : `${filteredVideos.length} videos available`}
            </span>
          </div>

          <CategoryPills
            categories={categoryOptions}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
            locale={locale}
          />
        </div>

        {/* Video Grid with In-Feed Playback */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" id="videos-feed-grid">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                locale={locale}
                isPlaying={playingVideoId === video.id}
                onPlay={(v) => {
                  setPlayingVideoId(v.id);
                }}
                onStop={() => {
                  setPlayingVideoId(null);
                }}
                onExpand={(v) => {
                  setModalVideo(v);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Film className="h-10 w-10 text-[#0A6847]" />}
            titleTa="காணொளிகள் எதுவும் கிடைக்கவில்லை"
            titleEn="No Videos Found"
            descriptionTa="நீங்கள் தேடிய தலைப்பில் காணொளிகள் இல்லை. மாற்று சொற்களைப் பயன்படுத்தி மீண்டும் தேடவும்."
            descriptionEn="No videos matched your search query. Try another term or clear active filters."
            actionLabelTa="அனைத்து காணொளிகளையும் காண்க"
            actionLabelEn="View All Videos"
            onAction={() => {
              setSearch("");
              setSelectedCategory("all");
              setPlayingVideoId(null);
            }}
          />
        )}
      </div>

      {/* Full Theater Modal (Optional Expansion Mode) */}
      {modalVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setModalVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-neutral-900 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[#0A6847] text-white flex items-center justify-center">
                  <Play className="h-4 w-4 ml-0.5 fill-white" />
                </div>
                <h3 id="video-modal-title" className="text-sm sm:text-base font-bold text-white font-tamil line-clamp-1">
                  {isTa ? modalVideo.titleTa : modalVideo.titleEn}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setModalVideo(null)}
                className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={isTa ? "மூடுக" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player Iframe */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={getAutoplayUrl(modalVideo.embedUrl)}
                title={isTa ? modalVideo.titleTa : modalVideo.titleEn}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Modal Footer Description */}
            <div className="p-4 sm:p-5 bg-neutral-900 text-xs sm:text-sm text-neutral-300 font-tamil leading-relaxed">
              {isTa ? modalVideo.descriptionTa : modalVideo.descriptionEn}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import { Search, Film, X, Play } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryPills, type CategoryOption } from "@/components/ui/CategoryPills";
import { VideoCard, type VideoData } from "@/components/videos/VideoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/context/LanguageContext";

/* Authentic videos extracted from videos.html */
const allVideos: VideoData[] = [
  {
    id: "1",
    titleTa: "மே 18 — நினைவேந்தல் ஆவணக் காணொளி",
    titleEn: "May 18 — Mullivaikkal Remembrance Documentary",
    descriptionTa: "தமிழீழ தேசிய நினைவேந்தல் நாள் மற்றும் மாவீரர்கள், பொதுமக்களின் தியாகங்களை நினைவுகூரும் சிறப்பு ஆவணப் பதிவு.",
    descriptionEn: "Solemn memorial documentary commemorating the martyrs and civilian sacrifices of May 18 Mullivaikkal.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/May-18---Memorial-Day:1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln&autoplay=true",
    posterImage: "/images/brand/banner-1200.webp",
    categoryTa: "நினைவேந்தல்",
    categoryEn: "Memorial",
    duration: "4:32",
    publishedDate: "மே 2026",
  },
  {
    id: "2",
    titleTa: "தலைவர் — காட்சிப்படுத்தும் புத்தகக் காணொளி",
    titleEn: "Leader — Book Presentation Showcase",
    descriptionTa: "தேசியத் தலைவரின் வரலாற்று ஆவண நூல்கள் மற்றும் வாழ்க்கை வரலாற்றுப் புத்தகங்களின் காட்சிப்படுத்தல்.",
    descriptionEn: "Visual preview and historical monograph presentation on National Leader Velupillai Prabhakaran.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/T-H-A-L-A-I-V-A-R:1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln&autoplay=true",
    posterImage: "/images/blogs/kanden-kanden-banner.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:45",
    publishedDate: "ஜூலை 2026",
  },
  {
    id: "3",
    titleTa: "திலீபம் — புத்தக வரலாற்று ஆவணக் காணொளி",
    titleEn: "Thileepam — Historical Book Showcase",
    descriptionTa: "தியாக தீபம் லெப். கேணல் திலீபன் அவர்களின் உண்ணாவிரத அறப்போர் மற்றும் 'திலீபம்' நூலின் முழு விபரம்.",
    descriptionEn: "Documentary preview exploring the non-violent struggle of Lt. Col. Thileepan and the book 'Thileepam'.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/Dhilipam---TEVP-TEVP:e?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln&autoplay=true",
    posterImage: "/images/blogs/deelipan-memorial.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "5:12",
    publishedDate: "ஆகஸ்ட் 2026",
  },
  {
    id: "4",
    titleTa: "யூலை 5 — கரும்புலிகள் நாள் சிறப்பு உரை & பதிவு",
    titleEn: "July 5 — Black Tigers Day Memorial Speech",
    descriptionTa: "1987 ஜூலை 5 அன்று நெல்லியடியில் கப்டன் மில்லர் நிகழ்த்திய முதல் கரும்புலித் தாக்குதலின் வரலாற்றுப் பதிவு.",
    descriptionEn: "Commemorating the first Black Tiger mission by Captain Miller at Nelliady on July 5, 1987.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/July-5-Black-Tigers-Speech:1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln&autoplay=true",
    posterImage: "/images/books/book-20.webp",
    categoryTa: "வரலாற்று ஆவணம்",
    categoryEn: "Historical Record",
    duration: "6:20",
    publishedDate: "ஜூலை 2026",
  },
  {
    id: "5",
    titleTa: "கட்டுநாயக்கா தாக்குதல் வெற்றி — வரலாற்று ஆவணப் பதிவு",
    titleEn: "Katunayake Airport Operation — Historical Action Analysis",
    descriptionTa: "2001 கட்டுநாயக்கா சர்வதேச விமான நிலைய வான்படைத் தளம் மீது 14 கரும்புலிகள் நடத்திய தாக்குதலின் தொகுப்பு.",
    descriptionEn: "Archival footage and tactical overview of the landmark July 24, 2001 Katunayake military airbase operation.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/kattanayaka:5?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln&autoplay=true",
    posterImage: "/images/blogs/thalapathi-vinayagam-banner.webp",
    categoryTa: "கள ஆவணம்",
    categoryEn: "Tactical History",
    duration: "8:10",
    publishedDate: "ஆகஸ்ட் 2026",
  },
  {
    id: "6",
    titleTa: "குட்டிமணி — தங்கதுரை நினைவு நாள் வரலாற்றுப் பதிவு",
    titleEn: "Kuttimani & Thangadurai Memorial Monograph",
    descriptionTa: "வெலிக்கடை சிறைப்படுகொலை மாவீரர்கள் தங்கதுரை, குட்டிமணி ஆகியோரின் இறுதி உரை மற்றும் வீர வரலாறு.",
    descriptionEn: "Remembering pioneers Thangadurai and Kuttimani and their unforgettable courtroom address for Tamil freedom.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/kuttimani---thanga-durai:1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln&autoplay=true",
    posterImage: "/images/books/book-04.webp",
    categoryTa: "நினைவேந்தல்",
    categoryEn: "Memorial",
    duration: "4:50",
    publishedDate: "ஜூலை 2026",
  },
  {
    id: "7",
    titleTa: "புறநானூற்று வீரன் — புத்தகக் காணொளி",
    titleEn: "Purananooru Veeran — Official Book Trailer",
    descriptionTa: "திருமுருகன்காளிலிங்கம் எழுதிய பெருவிற்பனை வரலாற்று ஆய்வு நூல் 'புறநானூற்று வீரன்' அறிமுகக் காணொளி.",
    descriptionEn: "Official video preview of the acclaimed historical research monograph 'Purananooru Veeran'.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/Purananutru-Veeran:c?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln&autoplay=true",
    posterImage: "/images/books/book-07.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:30",
    publishedDate: "ஜூன் 2026",
  },
  {
    id: "8",
    titleTa: "நெஞ்சுரம் — வரலாற்று ஆவணப் புத்தகக் காணொளி",
    titleEn: "Nenjuram — Fortitude of Spirit Book Trailer",
    descriptionTa: "துளசிச்செல்வன் எழுதிய கள அனுபவ ஆவணப் புத்தகம் 'நெஞ்சுரம்' நூலின் சிறப்பு அறிமுகக் காட்சிப்பதிவு.",
    descriptionEn: "Video showcase for Thulasichelvan's powerful memoir 'Nenjuram — Fortitude of Spirit'.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/nenjuram:c?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/books/book-16.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "4:15",
    publishedDate: "மே 2026",
  },
  {
    id: "9",
    titleTa: "மேதகு களஞ்சியம் — வலைதள அறிமுகமும் நூல்கள் விநியோகமும்",
    titleEn: "Methagu Kalanjiyam — Platform & Delivery System",
    descriptionTa: "உலகத் தமிழர்களுக்கு அரிய தேசிய இலக்கியங்களை தபால் வழியாக பாதுகாப்பாக கொண்டு சேர்க்கும் மேதகு களஞ்சியத்தின் சேவை.",
    descriptionEn: "Introduction to Methagu Kalanjiyam's mission to preserve and courier rare Tamil national literature worldwide.",
    embedUrl: "https://odysee.com/$/embed/@Methagu_kalanjiyam:7/Website:27?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln&autoplay=true",
    posterImage: "/images/brand/banner-1600.webp",
    categoryTa: "அறிமுகம்",
    categoryEn: "Overview",
    duration: "2:55",
    publishedDate: "ஏப்ரல் 2026",
  },
];

const categoryOptions: CategoryOption[] = [
  { slug: "book-showcase", labelTa: "புத்தகக் காணொளி", labelEn: "Book Showcase" },
  { slug: "memorial", labelTa: "நினைவேந்தல்", labelEn: "Memorials" },
  { slug: "history", labelTa: "வரலாற்று ஆவணம்", labelEn: "History" },
  { slug: "tactical", labelTa: "கள ஆவணம்", labelEn: "Tactical" },
  { slug: "overview", labelTa: "அறிமுகம்", labelEn: "Overview" },
];

export default function VideosPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [activeVideo, setActiveVideo] = React.useState<VideoData | null>(null);

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

  // Lock body scroll and close modal on Escape
  React.useEffect(() => {
    if (activeVideo) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setActiveVideo(null);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [activeVideo]);

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Top Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "வீடியோ ஆவணங்கள்" : "Video Archives" },
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
              ? "மேதகு களஞ்சியத்தின் அரிய வரலாற்று ஆவணங்கள், புத்தக அறிமுகக் காட்சிகள் மற்றும் மாவீரர் நினைவேந்தல் காணொளிகள்."
              : "Rare archival video clips, literary book trailers, and historic documentary footage preserved for posterity."}
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
                  ? "தலைவரின் வரலாற்றுப் பிரகடனங்கள் மற்றும் களத்து நினைவேந்தல் ஆவணங்கள்"
                  : "Preserved speeches and solemn memorial documentaries from national archives"}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Search + Categories (Hick's Law) */}
        <div className="space-y-4 pt-4 border-t border-black/8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A6847]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            onSelect={setSelectedCategory}
            locale={locale}
          />
        </div>

        {/* Video Grid (Gestalt Similarity) */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                locale={locale}
                onPlay={(v) => setActiveVideo(v)}
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
            }}
          />
        )}

      </div>

      {/* Video Playback Modal (Accessible Dialog with Backdrop & Focus Lock) */}
      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveVideo(null)}
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
                  {isTa ? activeVideo.titleTa : activeVideo.titleEn}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={isTa ? "மூடுக" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player Iframe */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={activeVideo.embedUrl}
                title={isTa ? activeVideo.titleTa : activeVideo.titleEn}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Modal Footer Description */}
            <div className="p-4 sm:p-5 bg-neutral-900 text-xs sm:text-sm text-neutral-300 font-tamil leading-relaxed">
              {isTa ? activeVideo.descriptionTa : activeVideo.descriptionEn}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

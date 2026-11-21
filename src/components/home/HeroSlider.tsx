"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { defaultHeroSlides } from "@/data/hero-slides";
import { HeroSlideData, HeroSliderProps } from "@/types/hero-slider";
import { cn } from "@/lib/utils";

export function HeroSlider({
  slides = defaultHeroSlides,
  autoplayDelay = 6500,
  className,
  priorityIndex = 0,
}: HeroSliderProps) {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isReducedMotion, setIsReducedMotion] = React.useState(false);
  const [progressKey, setProgressKey] = React.useState(0);

  // Initialize Autoplay plugin with 6.5s delay
  const autoplay = React.useRef(
    Autoplay({
      delay: autoplayDelay,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
      playOnInit: true,
    })
  );

  // Initialize Embla Carousel with Fade & Autoplay plugins
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 35,
      watchDrag: true,
    },
    [Fade(), autoplay.current]
  );

  // Check prefers-reduced-motion (WCAG 2.2.2 & 2.3.3 compliance)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setIsPlaying(false);
      autoplay.current?.stop();
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
      if (e.matches) {
        setIsPlaying(false);
        autoplay.current?.stop();
      } else {
        setIsPlaying(true);
        autoplay.current?.play();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Deep-link / query param support (?slide=0..3)
  React.useEffect(() => {
    if (!emblaApi || typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const slideParam = params.get("slide");
      if (slideParam !== null) {
        const targetIdx = parseInt(slideParam, 10);
        if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx < slides.length) {
          emblaApi.scrollTo(targetIdx, true);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [emblaApi, slides.length]);

  // Sync selected index with Embla and restart progress animation key
  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setProgressKey((prev) => prev + 1);
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    const onPlay = () => setIsPlaying(true);
    const onStop = () => setIsPlaying(false);

    emblaApi.on("autoplay:play", onPlay);
    emblaApi.on("autoplay:stop", onStop);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("autoplay:play", onPlay);
      emblaApi.off("autoplay:stop", onStop);
    };
  }, [emblaApi, onSelect]);

  // Pause when browser tab is inactive / hidden
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        autoplay.current?.stop();
      } else if (!isReducedMotion && isPlaying && !isHovered) {
        autoplay.current?.play();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isReducedMotion, isPlaying, isHovered]);

  // Keyboard navigation support
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        emblaApi?.scrollPrev();
      } else if (e.key === "ArrowRight") {
        emblaApi?.scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emblaApi]);

  const scrollPrev = React.useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = React.useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const togglePlayPause = React.useCallback(() => {
    if (!autoplay.current) return;
    if (isPlaying) {
      autoplay.current.stop();
      setIsPlaying(false);
    } else {
      autoplay.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const isPaused = !isPlaying || isHovered || isReducedMotion;

  return (
    <section
      className={cn(
        "relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6",
        className
      )}
      aria-roledescription="carousel"
      aria-label={isTa ? "முக்கிய வரலாற்று ஆவணங்கள்" : "Featured Archival Literature"}
      aria-live="off"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Viewport Card */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#121312] border border-black/10 shadow-2xl min-h-[460px] sm:min-h-[540px] lg:min-h-[580px] xl:min-h-[600px] flex items-end">
        {/* Embla Viewport */}
        <div className="overflow-hidden absolute inset-0 w-full h-full" ref={emblaRef}>
          <div className="flex h-full w-full">
            {slides.map((slide, index) => {
              const isActive = index === selectedIndex;
              const isEager = index === priorityIndex;

              return (
                <div
                  key={slide.id}
                  className="flex-[0_0_100%] min-w-0 relative h-full w-full select-none"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${slides.length}`}
                  aria-hidden={!isActive}
                >
                  {/* Background Artwork with Soft Cinematic Ken Burns Scale */}
                  <div className="absolute inset-0 w-full h-full bg-[#161817] overflow-hidden">
                    <picture className="absolute inset-0 w-full h-full">
                      {slide.mobileBannerImage && (
                        <source media="(max-width: 640px)" srcSet={slide.mobileBannerImage} />
                      )}
                      <Image
                        src={slide.bannerImage}
                        alt={isTa ? slide.titleTa : slide.titleEn}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1280px"
                        priority={isEager}
                        loading={isEager ? "eager" : "lazy"}
                        className={cn(
                          "object-cover object-center w-full h-full brightness-[1.03] contrast-[1.02] transition-transform duration-[7000ms] ease-out will-change-transform",
                          isActive && !isReducedMotion ? "scale-100" : "scale-[1.03]",
                          isReducedMotion && "transform-none transition-none"
                        )}
                      />
                    </picture>

                    {/* Directional Soft Gradient Scrims: Vivid Artwork + Crystal Clear Legibility */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.32)_42%,transparent_78%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.22)_45%,transparent_75%)] pointer-events-none" />
                  </div>

                  {/* Editorial Left-Aligned Caption Block */}
                  <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-8 lg:p-14 xl:p-16 !text-white pointer-events-none">
                    <div className="pointer-events-auto max-w-3xl space-y-2.5 sm:space-y-4">
                      {/* Eyebrow Label with Hairline Rule */}
                      <div
                        className={cn(
                          "flex items-center gap-2.5 transition-all duration-700 ease-out",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3 pointer-events-none",
                          isReducedMotion && "transition-none translate-y-0 opacity-100"
                        )}
                      >
                        <span className="h-[1px] w-5 sm:w-6 bg-emerald-400 inline-block shadow-sm" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-mono !text-emerald-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                          {isTa ? slide.eyebrowTa : slide.eyebrowEn}
                        </span>
                      </div>

                      {/* Display Headline — Exactly one <h1> on slide 0 */}
                      {index === 0 ? (
                        <h1
                          className={cn(
                            "text-[clamp(1.35rem,5.5vw,2.75rem)] sm:text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.16] font-bold font-serif font-tamil-serif !text-white tracking-[-0.015em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all duration-700 delay-[80ms] ease-out",
                            isActive
                              ? "opacity-100 translate-y-0"
                              : "opacity-0 translate-y-3 pointer-events-none",
                            isReducedMotion && "transition-none translate-y-0 opacity-100"
                          )}
                        >
                          {isTa ? slide.titleTa : slide.titleEn}
                        </h1>
                      ) : (
                        <h2
                          className={cn(
                            "text-[clamp(1.35rem,5.5vw,2.75rem)] sm:text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.16] font-bold font-serif font-tamil-serif !text-white tracking-[-0.015em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all duration-700 delay-[80ms] ease-out",
                            isActive
                              ? "opacity-100 translate-y-0"
                              : "opacity-0 translate-y-3 pointer-events-none",
                            isReducedMotion && "transition-none translate-y-0 opacity-100"
                          )}
                        >
                          {isTa ? slide.titleTa : slide.titleEn}
                        </h2>
                      )}

                      {/* Subtitle / Narrative Description */}
                      <p
                        className={cn(
                          "text-[clamp(0.8125rem,3vw,1.05rem)] sm:text-[clamp(0.875rem,1.15vw,1.05rem)] !text-white/95 font-medium leading-relaxed max-w-2xl font-tamil drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)] transition-all duration-700 delay-[160ms] ease-out line-clamp-3 sm:line-clamp-none",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3 pointer-events-none",
                          isReducedMotion && "transition-none translate-y-0 opacity-100"
                        )}
                      >
                        {isTa ? slide.subtitleTa : slide.subtitleEn}
                      </p>

                      {/* Editorial Actions (Primary Pill + Secondary Underline Link) */}
                      <div
                        className={cn(
                          "flex flex-wrap items-center gap-4 pt-1 sm:pt-2 transition-all duration-700 delay-[240ms] ease-out",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3 pointer-events-none",
                          isReducedMotion && "transition-none translate-y-0 opacity-100"
                        )}
                      >
                        <Link
                          href={slide.ctaPrimaryHref}
                          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          <span>{isTa ? slide.ctaPrimaryLabelTa : slide.ctaPrimaryLabelEn}</span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>

                        {slide.ctaSecondaryHref && (
                          <Link
                            href={slide.ctaSecondaryHref}
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white hover:text-emerald-300 transition-colors relative group py-2 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
                          >
                            <span>
                              {isTa ? slide.ctaSecondaryLabelTa : slide.ctaSecondaryLabelEn}
                            </span>
                            <span className="absolute bottom-1 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Control Bar: Monospaced Counter & Play/Pause */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={
              isPlaying
                ? isTa
                  ? "ஸ்லைடு இடைநிறுத்துக (Pause)"
                  : "Pause slideshow"
                : isTa
                ? "ஸ்லைடு இயக்குக (Play)"
                : "Play slideshow"
            }
            className="h-9 w-9 rounded-full bg-black/25 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
            )}
          </button>

          <div
            className="px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-white/90 text-[11px] font-mono tabular-nums tracking-widest border border-white/20 shadow-sm"
            aria-label={`Slide ${selectedIndex + 1} of ${slides.length}`}
          >
            {String(selectedIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>
        </div>

        {/* Bottom Bar: Hairline Progress Line Indicators & Prev/Next Arrows */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-4 sm:gap-6">
          {/* Thin Line Progress Indicators */}
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label={isTa ? "ஸ்லைடு வழிசெலுத்தல்" : "Slide progress navigation"}
          >
            {slides.map((slide, idx) => {
              const isCurrent = idx === selectedIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={`Go to slide ${idx + 1}: ${isTa ? slide.titleTa : slide.titleEn}`}
                  onClick={() => scrollTo(idx)}
                  className="group relative h-6 py-2.5 flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xs"
                >
                  <span className="block h-[2px] w-8 sm:w-12 rounded-full bg-white/20 overflow-hidden relative transition-colors group-hover:bg-white/40">
                    {isCurrent ? (
                      <span
                        key={progressKey}
                        className="block h-full w-full bg-white rounded-full animate-hero-progress"
                        style={
                          {
                            "--hero-autoplay-duration": `${autoplayDelay}ms`,
                            animationPlayState: isPaused ? "paused" : "running",
                          } as React.CSSProperties
                        }
                      />
                    ) : idx < selectedIndex ? (
                      <span className="block h-full w-full bg-white/60 rounded-full" />
                    ) : (
                      <span className="block h-full w-0" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Minimal Editorial Prev / Next Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label={isTa ? "முந்தைய ஸ்லைடு" : "Previous slide"}
              className="h-9 w-9 rounded-full bg-black/25 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={scrollNext}
              aria-label={isTa ? "அடுத்த ஸ்லைடு" : "Next slide"}
              className="h-9 w-9 rounded-full bg-black/25 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

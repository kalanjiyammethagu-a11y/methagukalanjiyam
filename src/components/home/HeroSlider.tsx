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
import { HeroSliderProps } from "@/types/hero-slider";
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
  const [isUserPaused, setIsUserPaused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isTouching, setIsTouching] = React.useState(false);
  const [isTabHidden, setIsTabHidden] = React.useState(false);
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

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Track tab visibility
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    setIsTabHidden(document.visibilityState === "hidden");

    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === "hidden");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Central autoplay controller: pause on user pause, hover, touch, focus, hidden tab, or reduced motion
  const shouldPause =
    isUserPaused || isHovered || isFocused || isTouching || isTabHidden || isReducedMotion;

  React.useEffect(() => {
    const plugin = autoplay.current;
    if (!plugin || !emblaApi) return;
    try {
      if (shouldPause) {
        plugin.stop();
      } else {
        plugin.play();
      }
    } catch {
      // Ignore if plugin not yet mounted
    }
  }, [shouldPause, emblaApi]);

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

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Keyboard navigation support when carousel has focus
  const handleCarouselKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        emblaApi?.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        emblaApi?.scrollNext();
      }
    },
    [emblaApi]
  );

  const scrollPrev = React.useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = React.useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const togglePlayPause = React.useCallback(() => {
    setIsUserPaused((prev) => !prev);
  }, []);

  const isPlayingUI = !isUserPaused && !isReducedMotion;

  return (
    <section
      className={cn(
        "relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2.5 sm:pt-5 overflow-hidden",
        className
      )}
      aria-roledescription="carousel"
      aria-label={isTa ? "முக்கிய வரலாற்று ஆவணங்கள்" : "Featured Archival Literature"}
      aria-live="off"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
      onTouchStart={() => setIsTouching(true)}
      onTouchEnd={() => setIsTouching(false)}
      onTouchCancel={() => setIsTouching(false)}
      onKeyDown={handleCarouselKeyDown}
    >
      {/* Main Viewport Card: Fluid clamp() + dvh height + compact landscape rule to avoid cropping or jumping */}
      <div
        className={cn(
          "relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#121312] border border-black/10 dark:border-white/10 shadow-2xl flex items-end",
          "h-[clamp(330px,82vw,440px)] max-h-[75dvh]",
          "sm:h-[clamp(420px,54vw,520px)] sm:max-h-[78dvh]",
          "lg:h-[clamp(460px,40vw,580px)] lg:max-h-[82dvh]",
          "[@media(max-height:500px)]:h-[clamp(250px,70dvh,285px)] [@media(max-height:500px)]:max-h-[75dvh]"
        )}
      >
        {/* Embla Viewport (touch-action: pan-y prevents vertical page scroll hijacking) */}
        <div
          className="overflow-hidden absolute inset-0 w-full h-full select-none"
          ref={emblaRef}
          style={{ touchAction: "pan-y" }}
        >
          <div className="flex h-full w-full" style={{ touchAction: "pan-y" }}>
            {slides.map((slide, index) => {
              const isActive = index === selectedIndex;
              const isEager = index === priorityIndex;
              const imgSrc = slide.bannerImage;

              return (
                <div
                  key={slide.id}
                  className="flex-[0_0_100%] min-w-0 relative h-full w-full select-none"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${slides.length}`}
                  aria-hidden={!isActive}
                >
                  {/* Background Artwork */}
                  <div className="absolute inset-0 w-full h-full bg-[#161817] overflow-hidden">
                    <Image
                      src={imgSrc}
                      alt={isTa ? slide.titleTa : slide.titleEn}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 94vw, 1216px"
                      priority={isEager}
                      loading={isEager ? "eager" : "lazy"}
                      className={cn(
                        "object-cover w-full h-full brightness-[0.98] contrast-[1.03] transition-transform duration-[7000ms] ease-out will-change-transform",
                        slide.objectPositionMobile || "object-center",
                        isActive && !isReducedMotion ? "scale-100" : "scale-[1.03]",
                        isReducedMotion && "transform-none transition-none"
                      )}
                    />

                    {/* Multi-stop Directional Gradient Scrims for WCAG AAA Text Legibility */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.78)_48%,rgba(0,0,0,0.38)_82%,rgba(0,0,0,0.18)_100%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.48)_62%,transparent_94%)] pointer-events-none" />
                  </div>

                  {/* Editorial Left-Aligned Caption Block */}
                  <div className="relative z-10 w-full h-full flex flex-col justify-end p-4 pt-14 pb-16 sm:p-8 sm:pt-16 sm:pb-20 lg:pb-12 lg:pr-80 xl:p-16 xl:pr-80 [@media(max-height:500px)]:p-4 [@media(max-height:500px)]:pt-3 [@media(max-height:500px)]:pb-14 !text-white pointer-events-none">
                    <div className="pointer-events-auto max-w-2xl space-y-1.5 sm:space-y-2.5 [@media(max-height:500px)]:space-y-1">
                      {/* Eyebrow Label */}
                      <div
                        className={cn(
                          "flex items-start sm:items-center gap-1.5 sm:gap-2 transition-all duration-700 ease-out pr-24 sm:pr-32 lg:pr-0",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3 pointer-events-none",
                          isReducedMotion && "transition-none translate-y-0 opacity-100"
                        )}
                      >
                        <span className="h-1.5 w-1.5 mt-1 sm:mt-0 rounded-full bg-emerald-400 animate-pulse shadow-xs shrink-0" />
                        <span
                          className={cn(
                            "text-[clamp(0.65rem,2.1vw,0.75rem)] leading-[1.4] font-bold text-emerald-300 drop-shadow-md",
                            isTa ? "font-tamil normal-case tracking-normal" : "font-mono uppercase tracking-[0.12em]"
                          )}
                        >
                          {isTa ? slide.eyebrowTa : slide.eyebrowEn}
                        </span>
                      </div>

                      {/* Display Headline — Exactly one <h1> on slide 0 */}
                      {index === 0 ? (
                        <h1
                          className={cn(
                            "text-[clamp(1.0625rem,3.6vw,2.15rem)] leading-[1.35] [@media(max-height:500px)]:text-[clamp(0.95rem,2.6vw,1.3rem)] font-bold font-serif font-tamil-serif !text-white tracking-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] transition-all duration-700 delay-[80ms] ease-out py-0.5 text-balance",
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
                            "text-[clamp(1.0625rem,3.6vw,2.15rem)] leading-[1.35] [@media(max-height:500px)]:text-[clamp(0.95rem,2.6vw,1.3rem)] font-bold font-serif font-tamil-serif !text-white tracking-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] transition-all duration-700 delay-[80ms] ease-out py-0.5 text-balance",
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
                          "text-[clamp(0.75rem,2.3vw,0.975rem)] leading-[1.5] !text-white/95 font-medium max-w-2xl font-tamil drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)] transition-all duration-700 delay-[160ms] ease-out line-clamp-2 sm:line-clamp-3 [@media(max-height:500px)]:line-clamp-1 py-0.5",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3 pointer-events-none",
                          isReducedMotion && "transition-none translate-y-0 opacity-100"
                        )}
                      >
                        {isTa ? slide.subtitleTa : slide.subtitleEn}
                      </p>

                      {/* Editorial Actions (Primary Pill + Secondary Link) */}
                      <div
                        className={cn(
                          "flex flex-wrap items-center gap-3 pt-1 sm:pt-1.5 [@media(max-height:500px)]:pt-0.5 transition-all duration-700 delay-[240ms] ease-out",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3 pointer-events-none",
                          isReducedMotion && "transition-none translate-y-0 opacity-100"
                        )}
                      >
                        <Link
                          href={slide.ctaPrimaryHref}
                          tabIndex={isActive ? 0 : -1}
                          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#0A6847] hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold font-tamil shadow-lg shadow-emerald-950/60 transition-all active:scale-95 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 touch-manipulation leading-normal"
                        >
                          <span>{isTa ? slide.ctaPrimaryLabelTa : slide.ctaPrimaryLabelEn}</span>
                          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </Link>

                        {slide.ctaSecondaryHref && (
                          <Link
                            href={slide.ctaSecondaryHref}
                            tabIndex={isActive ? 0 : -1}
                            className="hidden sm:inline-flex [@media(max-height:500px)]:hidden items-center gap-2 text-xs sm:text-sm font-medium text-white hover:text-emerald-300 transition-colors relative group py-2 px-1 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] font-tamil touch-manipulation leading-normal"
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

        {/* Top Control Bar: Play/Pause & Slide Counter (>= 44x44px, 8px spacing) */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayPause}
            aria-pressed={!isPlayingUI}
            aria-label={
              isPlayingUI
                ? isTa
                  ? "ஸ்லைடு இடைநிறுத்துக (Pause)"
                  : "Pause slideshow"
                : isTa
                ? "ஸ்லைடு இயக்குக (Play)"
                : "Play slideshow"
            }
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 touch-manipulation"
            title={isPlayingUI ? "Pause" : "Play"}
          >
            {isPlayingUI ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" aria-hidden="true" />
            )}
          </button>

          <div
            className="px-3 py-1.5 min-h-[44px] flex items-center rounded-full bg-black/55 backdrop-blur-md text-white text-[11px] font-mono tabular-nums tracking-widest border border-white/25 shadow-sm"
            aria-label={`Slide ${selectedIndex + 1} of ${slides.length}`}
          >
            {String(selectedIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>
        </div>

        {/* Bottom Control Bar: Indicator Tabs & Prev/Next Arrows (>= 44x44px targets, >= 8px spacing) */}
        <div className="absolute bottom-2.5 right-3 sm:bottom-5 sm:right-5 z-20 flex items-center gap-3 sm:gap-5">
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
                  className="group relative min-h-[44px] min-w-[44px] p-2 flex items-center justify-center cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded-lg touch-manipulation"
                >
                  <span className="block h-[3px] w-7 sm:w-10 rounded-full bg-white/35 overflow-hidden relative transition-colors group-hover:bg-white/60">
                    {isCurrent ? (
                      <span
                        key={progressKey}
                        className="block h-full w-full bg-white rounded-full animate-hero-progress"
                        style={
                          {
                            "--hero-autoplay-duration": `${autoplayDelay}ms`,
                            animationPlayState: shouldPause ? "paused" : "running",
                          } as React.CSSProperties
                        }
                      />
                    ) : idx < selectedIndex ? (
                      <span className="block h-full w-full bg-white/80 rounded-full" />
                    ) : (
                      <span className="block h-full w-0" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Prev / Next Arrows (hidden below md to keep mobile & narrow landscape clear for swipe) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label={isTa ? "முந்தைய ஸ்லைடு" : "Previous slide"}
              className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 touch-manipulation"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={scrollNext}
              aria-label={isTa ? "அடுத்த ஸ்லைடு" : "Next slide"}
              className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 touch-manipulation"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

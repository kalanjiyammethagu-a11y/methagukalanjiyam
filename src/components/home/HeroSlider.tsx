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
      {/* Main Viewport Card: Aspect-ratio split card on mobile portrait (< md), full-bleed overlay on md+ desktop & compact landscape */}
      <div
        className={cn(
          "relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-[#121312] border border-black/10 dark:border-white/10 shadow-2xl flex flex-col",
          "md:block md:h-[clamp(420px,54vw,520px)] md:max-h-[78dvh]",
          "lg:h-[clamp(460px,40vw,580px)] lg:max-h-[82dvh]",
          "[@media(max-height:500px)]:block [@media(max-height:500px)]:h-[clamp(250px,70dvh,285px)] [@media(max-height:500px)]:max-h-[75dvh]"
        )}
      >
        {/* Embla Viewport (touch-action: pan-y prevents vertical page scroll hijacking) */}
        <div
          className="overflow-hidden relative w-full md:absolute md:inset-0 md:h-full [@media(max-height:500px)]:absolute [@media(max-height:500px)]:inset-0 [@media(max-height:500px)]:h-full select-none"
          ref={emblaRef}
          style={{ touchAction: "pan-y" }}
        >
          <div className="flex md:h-full w-full items-stretch" style={{ touchAction: "pan-y" }}>
            {slides.map((slide, index) => {
              const isActive = index === selectedIndex;
              const isEager = index === priorityIndex;
              const desktopImgSrc = slide.bannerImage;
              const mobileImgSrc = slide.mobileBannerImage || slide.bannerImage;

              return (
                <div
                  key={slide.id}
                  className="flex-[0_0_100%] min-w-0 relative w-full md:h-full [@media(max-height:500px)]:h-full flex flex-col md:block [@media(max-height:500px)]:block select-none"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${slides.length}`}
                  aria-hidden={!isActive}
                >
                  {/* Background Artwork: Native 16:9 ratio on mobile (< md) so widescreen banners never crop awkwardly; full-bleed on md+ */}
                  <div className="relative w-full aspect-[16/9] bg-[#161817] overflow-hidden md:absolute md:inset-0 md:aspect-auto md:h-full [@media(max-height:500px)]:absolute [@media(max-height:500px)]:inset-0 [@media(max-height:500px)]:aspect-auto [@media(max-height:500px)]:h-full shrink-0">
                    <Image
                      src={mobileImgSrc}
                      alt={isTa ? slide.titleTa : slide.titleEn}
                      fill
                      sizes="100vw"
                      priority={isEager}
                      loading={isEager ? "eager" : "lazy"}
                      className={cn(
                        "md:hidden [@media(max-height:500px)]:hidden object-cover w-full h-full brightness-[0.98] contrast-[1.03] transition-transform duration-[7000ms] ease-out will-change-transform",
                        slide.objectPositionMobile || "object-center",
                        isActive && !isReducedMotion ? "scale-100" : "scale-[1.03]",
                        isReducedMotion && "transform-none transition-none"
                      )}
                    />
                    <Image
                      src={desktopImgSrc}
                      alt={isTa ? slide.titleTa : slide.titleEn}
                      fill
                      sizes="(max-width: 1280px) 94vw, 1216px"
                      priority={isEager}
                      loading={isEager ? "eager" : "lazy"}
                      className={cn(
                        "hidden md:block object-cover w-full h-full brightness-[0.98] contrast-[1.03] transition-transform duration-[7000ms] ease-out will-change-transform",
                        slide.objectPositionMobile || "object-center",
                        isActive && !isReducedMotion ? "scale-100" : "scale-[1.03]",
                        isReducedMotion && "transform-none transition-none"
                      )}
                    />

                    {/* Mobile subtle bottom melt + top-corner readability; Desktop keeps exact multi-stop scrims */}
                    <div className="md:hidden [@media(max-height:500px)]:hidden absolute inset-0 bg-[linear-gradient(to_top,#121312_0%,rgba(18,19,18,0.42)_32%,rgba(0,0,0,0.08)_70%,rgba(0,0,0,0.28)_100%)] pointer-events-none" />
                    <div className="hidden md:block [@media(max-height:500px)]:block absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.78)_48%,rgba(0,0,0,0.38)_82%,rgba(0,0,0,0.18)_100%)] pointer-events-none" />
                    <div className="hidden md:block [@media(max-height:500px)]:block absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.48)_62%,transparent_94%)] pointer-events-none" />

                    {/* Mobile Top-Left Year / Category Pill inside clean 16:9 image frame */}
                    <div className="md:hidden [@media(max-height:500px)]:hidden absolute top-3 left-3 z-10 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-emerald-300 shadow-sm font-tamil">
                        <span className="font-mono tabular-nums text-white/90">{slide.year}</span>
                        <span className="text-white/40">•</span>
                        <span>{isTa ? slide.categoryTa : slide.categoryEn}</span>
                      </span>
                    </div>
                  </div>

                  {/* Editorial Left-Aligned Caption Block (Dedicated surface below 16:9 banner on mobile; overlay on md+ desktop) */}
                  <div className="relative z-10 w-full flex-1 md:flex-none md:h-full flex flex-col justify-between md:justify-end p-4 pt-2 pb-4 bg-[#121312] md:bg-transparent md:p-8 md:pt-16 md:pb-20 lg:pb-12 lg:pr-80 xl:p-16 xl:pr-80 [@media(max-height:500px)]:h-full [@media(max-height:500px)]:justify-end [@media(max-height:500px)]:bg-transparent [@media(max-height:500px)]:p-4 [@media(max-height:500px)]:pt-3 [@media(max-height:500px)]:pb-14 !text-white pointer-events-none">
                    <div className="pointer-events-auto max-w-2xl space-y-1.5 sm:space-y-2 md:space-y-2.5 [@media(max-height:500px)]:space-y-1">
                      {/* Eyebrow Label */}
                      <div
                        className={cn(
                          "flex items-start sm:items-center gap-1.5 sm:gap-2 transition-all duration-700 ease-out md:pr-32 lg:pr-0",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3 pointer-events-none",
                          isReducedMotion && "transition-none translate-y-0 opacity-100"
                        )}
                      >
                        <span className="h-1.5 w-1.5 mt-1.5 sm:mt-0 rounded-full bg-emerald-400 animate-pulse shadow-xs shrink-0" />
                        <span
                          className={cn(
                            "text-[11px] sm:text-xs leading-[1.4] font-bold text-emerald-300 drop-shadow-md",
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
                            "text-[clamp(1.125rem,4.6vw,1.5rem)] md:text-[clamp(1.25rem,3.4vw,2.15rem)] leading-[1.32] md:leading-[1.35] [@media(max-height:500px)]:text-[clamp(0.95rem,2.6vw,1.3rem)] font-bold font-serif font-tamil-serif !text-white tracking-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] transition-all duration-700 delay-[80ms] ease-out py-0.5 text-balance line-clamp-2 min-h-[2.64em] md:line-clamp-none md:min-h-0",
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
                            "text-[clamp(1.125rem,4.6vw,1.5rem)] md:text-[clamp(1.25rem,3.4vw,2.15rem)] leading-[1.32] md:leading-[1.35] [@media(max-height:500px)]:text-[clamp(0.95rem,2.6vw,1.3rem)] font-bold font-serif font-tamil-serif !text-white tracking-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] transition-all duration-700 delay-[80ms] ease-out py-0.5 text-balance line-clamp-2 min-h-[2.64em] md:line-clamp-none md:min-h-0",
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
                          "text-xs sm:text-sm md:text-[clamp(0.85rem,1.4vw,0.975rem)] leading-[1.5] !text-zinc-200 md:!text-white/95 font-medium max-w-2xl font-tamil drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)] transition-all duration-700 delay-[160ms] ease-out line-clamp-2 min-h-[2.4rem] md:min-h-0 md:line-clamp-3 [@media(max-height:500px)]:line-clamp-1 [@media(max-height:500px)]:min-h-0 py-0.5",
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
                          "flex flex-wrap items-center gap-3 pt-1.5 [@media(max-height:500px)]:pt-0.5 transition-all duration-700 delay-[240ms] ease-out",
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
                            className="inline-flex [@media(max-height:500px)]:hidden items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-300 md:text-white hover:text-emerald-300 transition-colors relative group py-2 px-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] font-tamil touch-manipulation leading-normal"
                          >
                            <span>
                              {isTa ? slide.ctaSecondaryLabelTa : slide.ctaSecondaryLabelEn}
                            </span>
                            <span className="hidden md:block absolute bottom-1 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
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
        <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 md:top-5 md:right-5 z-20 flex items-center gap-2">
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
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 touch-manipulation"
            title={isPlayingUI ? "Pause" : "Play"}
          >
            {isPlayingUI ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" aria-hidden="true" />
            )}
          </button>

          <div
            className="px-3 py-1.5 min-h-[44px] flex items-center rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono tabular-nums tracking-widest border border-white/25 shadow-sm"
            aria-label={`Slide ${selectedIndex + 1} of ${slides.length}`}
          >
            {String(selectedIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>
        </div>

        {/* Bottom Control Bar: Clean dedicated strip below content on mobile portrait; overlaid bottom-right on md+ desktop */}
        <div className="relative z-20 flex items-center justify-between px-3 py-1 border-t border-white/10 bg-[#0d0e0d] md:border-t-0 md:bg-transparent md:p-0 md:absolute md:bottom-5 md:right-5 md:gap-5 [@media(max-height:500px)]:border-t-0 [@media(max-height:500px)]:bg-transparent [@media(max-height:500px)]:p-0 [@media(max-height:500px)]:absolute [@media(max-height:500px)]:bottom-2.5 [@media(max-height:500px)]:right-3">
          <div
            className="flex items-center gap-1 sm:gap-2"
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
                  className="group relative min-h-[44px] min-w-[40px] sm:min-w-[44px] p-1.5 sm:p-2 flex items-center justify-center cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded-lg touch-manipulation"
                >
                  <span className="block h-[3px] w-7 sm:w-9 md:w-10 rounded-full bg-white/35 overflow-hidden relative transition-colors group-hover:bg-white/60">
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

          {/* Prev / Next Arrows (Visible on mobile bottom strip AND md+ desktop; hidden only on compact landscape height<=500px) */}
          <div className="flex [@media(max-height:500px)]:hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label={isTa ? "முந்தைய ஸ்லைடு" : "Previous slide"}
              className="h-10 w-10 md:h-11 md:w-11 min-h-[40px] min-w-[40px] md:min-h-[44px] md:min-w-[44px] rounded-full bg-white/10 md:bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/20 md:border-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 touch-manipulation"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={scrollNext}
              aria-label={isTa ? "அடுத்த ஸ்லைடு" : "Next slide"}
              className="h-10 w-10 md:h-11 md:w-11 min-h-[40px] min-w-[40px] md:min-h-[44px] md:min-w-[44px] rounded-full bg-white/10 md:bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/20 md:border-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 touch-manipulation"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

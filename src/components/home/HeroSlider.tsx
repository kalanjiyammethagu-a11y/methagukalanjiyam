"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";

interface Slide {
  id: string;
  bannerImage: string;
  mobileBannerImage?: string;
  bookImage: string;
  slug: string;
  price: number;
  year: string;
  ta: {
    badge: string;
    title: string;
    subtitle: string;
    category: string;
    ctaPrimary: string;
    ctaSecondary: string;
    quote: string;
  };
  en: {
    badge: string;
    title: string;
    subtitle: string;
    category: string;
    ctaPrimary: string;
    ctaSecondary: string;
    quote: string;
  };
}

const slides: Slide[] = [
  {
    id: "flagship",
    bannerImage: "/images/brand/images/brand/banner-1200.webp",
    mobileBannerImage: "/images/brand/images/brand/banner-800.webp",
    bookImage: "/images/books/book-07.webp",
    slug: "purananooru-veeran",
    price: 499,
    year: "2005",
    ta: {
      badge: "தேசிய ஆவணக் களஞ்சியம் • முதன்மைப் பதிப்பகம்",
      title: "மேதகு களஞ்சியம் — தேசிய வரலாற்று அறிவுப் பெட்டகம்",
      subtitle:
        "அரிய தமிழ் தேசிய நூல்களின் தனித்துவமான தொகுப்பு. நமக்கு வழிகாட்டும் வரலாற்றை நம்மிடம் வாசியுங்கள்.",
      category: "தேசிய வரலாறு",
      ctaPrimary: "நூல்களைக் காண்க",
      ctaSecondary: "ஆவணப் பட்டியல்",
      quote: "அழிந்துவிடாமல் பாதுகாக்கப்படும் வரலாறே எதிர்கால சந்ததிக்கான வழிகாட்டும் கலங்கரை விளக்கம்.",
    },
    en: {
      badge: "National Historical Archives • Premier Bookstore",
      title: "Methagu Kalanjiyam — The Treasury of Tamil History",
      subtitle:
        "An authoritative repository of rare Tamil political literature, battlefield memoirs, and historical records.",
      category: "National History",
      ctaPrimary: "Explore Catalog",
      ctaSecondary: "View Archives",
      quote: "Preserved history is the guiding light for the freedom of future generations.",
    },
  },
  {
    id: "thileepan",
    bannerImage: "/images/blogs/deelipan-hero.webp",
    bookImage: "/images/books/book-02.webp",
    slug: "thileepanudan-12-naatkal",
    price: 100,
    year: "1987",
    ta: {
      badge: "அறப்போர் ஆவணம் • தியாக தீபம் திலீபன்",
      title: "திலீபனுடன் 12 நாட்கள் — வரலாற்று ஆவணம்",
      subtitle:
        "நீராகாரமும் இன்றி 12 நாட்கள் யாழ் நல்லூர் முன்றலில் நிகழ்ந்த ஒப்பற்ற அறப்போராட்டத்தின் நேரடி சாட்சியம்.",
      category: "வரலாற்றுப் பதிவு",
      ctaPrimary: "நூலை ஆர்டர் செய்க",
      ctaSecondary: "விபரம் காண்க",
      quote: "தான் நேசித்த மக்களுக்காக, தான் நேசித்த மண்ணுக்காக ஒருவன் எத்தகைய உன்னதமான தியாகத்தை செய்ய முடியுமோ, அதைத் திலீபன் செய்தான்.",
    },
    en: {
      badge: "Historic Satyagraha • Flame of Sacrifice",
      title: "12 Days with Thileepan — Eyewitness Record",
      subtitle:
        "The historic 12-day fast unto death without water at Nallur, Jaffna — a sacrifice that inspired generations.",
      category: "Historical Record",
      ctaPrimary: "Order Book",
      ctaSecondary: "Read Details",
      quote: "He offered the supreme sacrifice a human being could ever render for his people and soil.",
    },
  },
  {
    id: "katunayake",
    bannerImage: "/images/blogs/saanthi-nesakaram-banner.webp",
    bookImage: "/images/books/book-20.webp",
    slug: "katunayake-attack-victory",
    price: 100,
    year: "2001",
    ta: {
      badge: "முதன்மை ஆவணம் • சாந்தி நேசக்கரம்",
      title: "கட்டுநாயக்கா தாக்குதல் வெற்றி",
      subtitle:
        "தமிழீழ விடுதலைப் போராட்ட வரலாற்றில் சாந்தி நேசக்கரம் ஆவணப்படுத்திய அரிய வரலாற்றுத் தடம்.",
      category: "ஆவணத் தொகுப்பு",
      ctaPrimary: "இப்போதே ஆர்டர் செய்க",
      ctaSecondary: "நூல் விபரம் காண்க",
      quote: "வீரத்திற்கும் தியாகத்திற்கும் உச்சமான அர்த்தம் கொடுத்து மடிந்துபோன வீரர்களின் நினைவிடம்.",
    },
    en: {
      badge: "Primary Archive • Saanthi Nesakaram",
      title: "Katunayake Air Base Victory",
      subtitle:
        "An unprecedented archival documentation of battlefield precision and sacrifice from the national archives.",
      category: "Archival Compilation",
      ctaPrimary: "Order Book Now",
      ctaSecondary: "View Archive Record",
      quote: "A sacred memorial for fighters who gave the ultimate meaning to valor and dedication.",
    },
  },
  {
    id: "leader",
    bannerImage: "/images/blogs/prabakaran-dad-banner.webp",
    bookImage: "/images/books/prabakaran-dad.webp",
    slug: "leader-thoughts",
    price: 120,
    year: "2005",
    ta: {
      badge: "தேசிய ஆவணம் • சிந்தனைப் பெட்டகம்",
      title: "வரலாற்று நாயகனின் உரைத் தொகுப்பு",
      subtitle:
        "தேசியத் தலைவர் மேதகு வே. பிரபாகரன் அவர்களின் வரலாற்றுப் பிரகடனங்கள் மற்றும் சிந்தனை ஆவணங்கள்.",
      category: "தலைவர்கள் சிந்தனை",
      ctaPrimary: "நூலை வாசிக்க",
      ctaSecondary: "முழு ஆவணம்",
      quote: "ஒரு விடுதலைப் போராளியின் சாவும் ஒரு சாதாரண மனிதனின் மரணமும் ஒன்றல்ல. அது சரித்திரத்தை உருவாக்குகிறது.",
    },
    en: {
      badge: "National Archive • Philosophy",
      title: "The Living Mind of the Leader",
      subtitle:
        "The authoritative compilation of historic speeches and political philosophy of Leader V. Prabhakaran.",
      category: "Leadership & Thought",
      ctaPrimary: "Explore Archive",
      ctaSecondary: "View Full Records",
      quote: "The death of a liberation fighter is not ordinary; it creates living history.",
    },
  },
  {
    id: "vinayagam",
    bannerImage: "/images/blogs/thalapathi-vinayagam-banner.webp",
    bookImage: "/images/books/book-13.webp",
    slug: "dhisai-thavara-kanai",
    price: 85,
    year: "2002",
    ta: {
      badge: "கள நாயகர்கள் • வரலாற்றுப் பதிவு",
      title: "திசை தவறாக்கணை தளபதிவிநாயகம்",
      subtitle:
        "களத்து நகர்வுகளும் தப்பிப்புகளும் நேரில் பார்க்கும் உணர்வைத் தரும் அரிய வரலாற்று நூல்.",
      category: "கள ஆவண நூல்",
      ctaPrimary: "நூலை முன்பதிவு செய்க",
      ctaSecondary: "விபரம் காண்க",
      quote: "களத்தின் ஒவ்வொரு நகர்விலும் துணிவும் தியாகமும் கலந்த வரலாற்று சாட்சியம்.",
    },
    en: {
      badge: "Battlefield Heroes • Monograph",
      title: "The Unswerving Arrow — Commander Vinayagam",
      subtitle:
        "Tactical breakthroughs, battlefield resilience, and firsthand chronicles of heroic field commanders.",
      category: "Field Chronicles",
      ctaPrimary: "Reserve Copy",
      ctaSecondary: "Read Details",
      quote: "An authentic firsthand testament of courage and tactical brilliance in the line of duty.",
    },
  },
  {
    id: "kanden",
    bannerImage: "/images/blogs/kanden-kanden-banner.webp",
    bookImage: "/images/books/kanden-kanden.webp",
    slug: "kanden-kanden",
    price: 95,
    year: "2004",
    ta: {
      badge: "தாயக நினைவுகள் • நாவல் வடிவம்",
      title: "கண்டேன் கண்டேன் — தாயக வரலாற்றுப் பதிவு",
      subtitle:
        "மறக்க முடியாத போராட்டக் கள நினைவுகள் மற்றும் தாயக மக்களின் அர்ப்பணிப்பின் நேரடிப் பதிவு.",
      category: "வரலாற்றுப் பதிவு",
      ctaPrimary: "ஆர்டர் செய்க",
      ctaSecondary: "முழுப் பட்டியல்",
      quote: "மண்ணுக்காகவும் மக்களுக்காகவும் வாழ்ந்த மனிதர்களின் நெகிழ்ச்சியான உண்மைப் பதிவு.",
    },
    en: {
      badge: "Homeland Memoirs • Narrative",
      title: "Kanden Kanden — Chronicles of the Homeland",
      subtitle:
        "An intimate, unforgettable firsthand narrative from the frontlines and communities of the Tamil struggle.",
      category: "Archival Narrative",
      ctaPrimary: "Order Copy",
      ctaSecondary: "View Catalog",
      quote: "The deeply moving and authentic chronicle of individuals dedicated to homeland and freedom.",
    },
  },
];

export function HeroSlider() {
  const { locale } = useLanguage();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);

  // Check user OS motion preferences (WCAG 2.2.2 / 2.3.3)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsPlaying(false);
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsPlaying(false);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Auto advance
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStart(null);
  };

  const currentSlide = slides[currentIndex];
  const content = locale === "ta" ? currentSlide.ta : currentSlide.en;

  // Keyboard navigation support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={locale === "ta" ? "முக்கிய ஆவணப் பதாகைகள்" : "Featured Archival Banners"}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6"
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onFocus={() => setIsPlaying(false)}
      onBlur={() => setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Slide Card Container */}
      <div className="relative rounded-3xl overflow-hidden border border-black/10 shadow-2xl bg-[#EBE7DF] min-h-[480px] sm:min-h-[520px] lg:min-h-[540px] flex items-end">
        
        {/* Background Banner Slides */}
        {/* Background Banner Slides with Cinematic Zoom Transition */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-out transform ${
                isActive
                  ? "opacity-100 scale-100 z-10"
                  : "opacity-0 scale-[1.04] z-0 pointer-events-none"
              }`}
            >
              <picture className="absolute inset-0 w-full h-full">
                {slide.mobileBannerImage && (
                  <source media="(max-width: 640px)" srcSet={slide.mobileBannerImage} />
                )}
                <Image
                  src={slide.bannerImage}
                  alt={locale === "ta" ? slide.ta.title : slide.en.title}
                  fill
                  sizes="(max-width: 640px) 800px, (max-width: 1280px) 1200px, 1600px"
                  priority={idx === 0}
                  className="object-cover object-center w-full h-full"
                />
              </picture>
              {/* Multi-layered Vignette & Soft Gradient for Optical Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
            </div>
          );
        })}

        {/* Top Control Bar with Slide Numbers & Pause */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "ஸ்லைடை இடைநிறுத்துக (Pause)" : "ஸ்லைடை இயக்குக (Play)"}
            className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/35 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95 shadow-sm"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <div className="px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs tabular-nums font-semibold border border-white/10 tracking-wider">
            {currentIndex + 1} / {slides.length}
          </div>
        </div>

        {/* Content Box Over Banner */}
        <div className="relative z-20 w-full p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          
          {/* Left Text Column */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4 text-white" suppressHydrationWarning>
            {/* Curated Archive Badge */}
            {content.badge && (
              <span className="inline-block text-xs sm:text-sm font-semibold text-amber-300 uppercase tracking-widest font-tamil drop-shadow-sm">
                {content.badge}
              </span>
            )}

            {/* Dynamic Title (Optical Tamil Typography) */}
            <h1
              suppressHydrationWarning
              className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.3] font-tamil-serif drop-shadow-md text-balance"
            >
              {content.title}
            </h1>

            {/* Subtitle with optical measure */}
            <p
              suppressHydrationWarning
              className="text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed font-tamil drop-shadow-sm font-medium text-pretty"
            >
              {content.subtitle}
            </p>

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                href={`/books/${currentSlide.slug}`}
                size="md"
                variant="primary"
                className="bg-[#0A6847] hover:bg-[#085438] text-white border border-emerald-400/30 shadow-lg shadow-black/30 font-tamil font-bold min-h-[46px] px-6"
              >
                <span>{content.ctaPrimary}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                href="/books"
                size="md"
                variant="glass"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 font-tamil font-semibold min-h-[46px] px-5"
              >
                <span>{content.ctaSecondary}</span>
              </Button>
            </div>

          </div>

          {/* Right Tactile Physical Book Highlight */}
          <div className="lg:col-span-4 hidden sm:flex justify-end">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-4.5 border border-white/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.55)] max-w-[270px] w-full text-zinc-900 group transition-all duration-500 hover:-translate-y-1.5">
              
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#F7F5EF] via-[#EFEBE1] to-[#E8E4DA] border border-black/10 shadow-lg group-hover:shadow-2xl transition-all">
                {/* Book Spine Shadow */}
                <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/35 via-black/10 to-transparent z-10 pointer-events-none" />
                {/* Paper page edge layering on the right */}
                <div className="absolute inset-y-1 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/20 to-transparent z-10 pointer-events-none" />
                
                <Image
                  src={currentSlide.bookImage}
                  alt={content.title}
                  fill
                  sizes="270px"
                  className="object-cover w-full h-full group-hover:scale-[1.03] transition-transform duration-500"
                />
                <Badge
                  variant="in_stock"
                  className="absolute top-2.5 right-2.5 shadow-md text-[10px] font-bold"
                >
                  {locale === "ta" ? "கையிருப்பில்" : "In Stock"}
                </Badge>
              </div>

              <div className="mt-3.5 space-y-1.5 font-tamil">
                <div className="flex items-center justify-between text-[11px] text-[#0A6847] font-bold tracking-wide">
                  <span className="truncate">{content.category}</span>
                  <span className="tabular-nums font-semibold text-zinc-600 shrink-0 ml-2">{currentSlide.year}</span>
                </div>
                <h2 className="font-bold text-sm text-[#111111] line-clamp-1 font-tamil-serif">
                  {content.title}
                </h2>
                <div className="pt-2 flex items-center justify-between border-t border-black/8">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">Price</span>
                    <span className="text-base font-extrabold text-[#111111]">₹{currentSlide.price}</span>
                  </div>
                  <Button
                    href={`/books/${currentSlide.slug}`}
                    size="sm"
                    variant="primary"
                    className="min-h-[38px] h-9 text-xs font-bold px-3.5 shadow-xs"
                  >
                    {locale === "ta" ? "வாங்குக" : "Order"}
                  </Button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Carousel Navigation Arrows */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label={locale === "ta" ? "முந்தைய ஸ்லைடு (Previous)" : "Previous Slide"}
            className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95 shadow-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label={locale === "ta" ? "அடுத்த ஸ்லைடு (Next)" : "Next Slide"}
            className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95 shadow-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Pagination Indicators with Active Progress Animation */}
        <div className="absolute bottom-4 left-6 sm:bottom-6 sm:left-12 z-30 flex items-center gap-2.5">
          {slides.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`relative transition-all duration-300 rounded-full overflow-hidden cursor-pointer ${
                  isActive
                    ? "w-10 h-2.5 bg-white/25 shadow-xs"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
                }`}
              >
                {isActive && (
                  <span
                    className={`absolute inset-0 bg-emerald-400 rounded-full ${
                      isPlaying ? "animate-progress" : "w-full"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}

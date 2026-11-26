"use client";

import * as React from "react";
import Image from "next/image";
import { ImageIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { BOOK_PLACEHOLDER_IMAGE, type BookGalleryImage } from "@/lib/book-images";
import { localized } from "@/lib/i18n";
import type { BookItem } from "@/data/books";
import { BookCoverActions } from "@/components/books/BookDetailClient";

interface BookCoverGalleryProps {
  book: BookItem;
}

export function BookCoverGallery({ book }: BookCoverGalleryProps) {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const slides = React.useMemo(() => {
    const frontSlide: BookGalleryImage & { isFrontCover: boolean } = {
      url: book.image || BOOK_PLACEHOLDER_IMAGE,
      kind: "other",
      alt_en: book.coverAltEn || `${book.titleEn} front cover (outside)`,
      alt_ta: book.coverAltTa || `${book.title} — முன் அட்டை`,
      isFrontCover: true,
    };

    const extras = (book.galleryImages || [])
      .filter((img) => img && img.url && img.url !== frontSlide.url)
      .map((img, idx) => ({
        url: img.url,
        kind: img.kind || ("inside" as const),
        alt_en:
          img.alt_en ||
          (img.kind === "back_cover"
            ? `${book.titleEn} back cover`
            : `${book.titleEn} inside page ${idx + 1}`),
        alt_ta:
          img.alt_ta ||
          (img.kind === "back_cover"
            ? `${book.title} — பின் அட்டை`
            : `${book.title} — உள்பக்கம் ${idx + 1}`),
        isFrontCover: false,
      }));

    return [frontSlide, ...extras];
  }, [book]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [failedUrls, setFailedUrls] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setActiveIndex(0);
    setFailedUrls({});
  }, [book.id, book.image]);

  const activeSlide = slides[activeIndex] ?? slides[0] ?? { url: BOOK_PLACEHOLDER_IMAGE, isFrontCover: true, kind: "front_cover" as const };
  const activeSrc =
    failedUrls[activeSlide.url] ? BOOK_PLACEHOLDER_IMAGE : activeSlide.url;

  const activeAlt = localized(
    activeSlide,
    "alt",
    locale,
    localized(book, "title", locale)
  );

  return (
    <>
      <div className="relative flex flex-col items-center justify-center gap-3">
        <div className="relative w-56 sm:w-64 lg:w-72 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl bg-[#ECE8DF] dark:bg-zinc-800">
          {activeSlide.isFrontCover && (
            <>
              {/* Spine shadow for 3D tactile book feel */}
              <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/30 via-black/5 to-transparent z-10 pointer-events-none" />
              {/* Top light reflection */}
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/20 to-transparent z-10 pointer-events-none" />
            </>
          )}
          <Image
            src={activeSrc}
            alt={activeAlt}
            fill
            sizes="(max-width: 1024px) 280px, 320px"
            className={cn(
              activeSlide.isFrontCover ? "object-cover" : "object-contain bg-stone-100 dark:bg-zinc-900"
            )}
            priority={activeIndex === 0}
            onError={() => {
              setFailedUrls((prev) => ({ ...prev, [activeSlide.url]: true }));
            }}
          />

          {/* Flagged missing front cover indicator when placeholder/unverified */}
          {book.coverIsFront === false && activeIndex === 0 && (
            <div className="absolute inset-x-2 bottom-2 z-20 rounded-lg bg-amber-950/85 text-amber-100 px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span className="leading-snug">
                {isTa
                  ? "முன் அட்டைப்படம் சரிபார்ப்பில் உள்ளது"
                  : "Front cover pending archival verification"}
              </span>
            </div>
          )}
        </div>

        {/* Active Image Role Label */}
        {slides.length > 1 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#555555] dark:text-zinc-400">
            <ImageIcon className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
            {activeSlide.isFrontCover
              ? isTa
                ? "முன் அட்டை (வெளிப்பக்கம்)"
                : "Front cover (outside)"
              : activeSlide.kind === "back_cover"
              ? isTa
                ? "பின் அட்டை"
                : "Back cover"
              : isTa
              ? `உள்பக்கக் காட்சி ${activeIndex}`
              : `Inside page ${activeIndex}`}
          </span>
        )}
      </div>

      {/* Interactive Gallery Thumbnails (Front cover strictly first) */}
      {slides.length > 1 && (
        <div
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
          role="tablist"
          aria-label={isTa ? "நூல் படங்கள்" : "Book images gallery"}
        >
          {slides.map((slide, idx) => {
            const isSelected = idx === activeIndex;
            const thumbSrc = failedUrls[slide.url] ? BOOK_PLACEHOLDER_IMAGE : slide.url;
            const label = slide.isFrontCover
              ? isTa
                ? "முன் அட்டை"
                : "Front"
              : slide.kind === "back_cover"
              ? isTa
                ? "பின் அட்டை"
                : "Back"
              : isTa
              ? `பக்கம் ${idx}`
              : `Inside ${idx}`;

            return (
              <button
                key={`${slide.url}-${idx}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={label}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative h-14 w-11 min-w-[44px] min-h-[44px] rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A6847]",
                  isSelected
                    ? "border-[#0A6847] ring-2 ring-[#0A6847]/25 scale-[1.03]"
                    : "border-black/10 dark:border-white/15 opacity-75 hover:opacity-100"
                )}
              >
                <Image
                  src={thumbSrc}
                  alt={label}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Share action button below cover */}
      <BookCoverActions book={book} />
    </>
  );
}

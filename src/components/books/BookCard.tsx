"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { BookmarkRibbonIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { getWhatsAppOrderUrl } from "@/lib/whatsapp";

export interface BookCardData {
  id: string;
  title: string;
  titleEn: string;
  author: string;
  authorEn: string;
  price: number;
  discountPrice?: number | null;
  categoryTa: string;
  categoryEn: string;
  image: string;
  stock: number;
  slug: string;
}

interface BookCardProps {
  book: BookCardData;
  locale?: "ta" | "en";
  variant?: "default" | "compact" | "featured" | "horizontal";
  onAddToCart?: (book: BookCardData) => void;
  className?: string;
}

export function BookCard({
  book,
  locale: propLocale,
  variant = "default",
  onAddToCart,
  className,
}: BookCardProps) {
  const { locale: contextLocale, isInWishlist, toggleWishlist, getFormattedAddress } = useLanguage();
  const locale = propLocale || contextLocale;
  const isWishlisted = isInWishlist(book.id);
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const isHorizontal = variant === "horizontal";
  const isSoldOut = book.stock <= 0;

  return (
    <article
      className={cn(
        "group relative flex glass-panel rounded-2xl overflow-hidden transition-all duration-300",
        isHorizontal ? "flex-col sm:flex-row items-stretch" : "flex-col",
        !isCompact && "glass-card-hover",
        isFeatured && "ring-1 ring-[#0A6847]/20 shadow-lg",
        className
      )}
    >
      {/* Top badges & Wishlist action */}
      <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
        {isFeatured ? (
          <span className="px-2.5 py-1 rounded-full bg-[#0A6847] text-white text-[11px] font-bold shadow-sm pointer-events-auto font-tamil">
            {locale === "ta" ? "சிறப்பு நூல்" : "Featured"}
          </span>
        ) : (
          <span />
        )}

        {/* Wishlist Bookmark Ribbon Button (Apple HIG 44px touch area) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(book.id, book.title, book.titleEn);
          }}
          aria-label={
            isWishlisted
              ? locale === "ta"
                ? "விருப்பப் பட்டியலிலிருந்து நீக்குக"
                : "Remove from wishlist"
              : locale === "ta"
                ? "விருப்பப் பட்டியலில் சேர்க்க"
                : "Save to wishlist"
          }
          className={cn(
            "min-h-[44px] min-w-[44px] h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm pointer-events-auto cursor-pointer active:scale-90",
            isWishlisted
              ? "bg-[#0A6847] text-white hover:bg-[#085237] shadow-md shadow-[#0A6847]/25 scale-105"
              : "bg-white/95 backdrop-blur-md text-[#555555] hover:text-[#0A6847] hover:bg-white border border-black/[0.06]"
          )}
          title={isWishlisted ? (locale === "ta" ? "சேமிக்கப்பட்டது" : "Saved") : (locale === "ta" ? "சேமிக்க" : "Save")}
        >
          <BookmarkRibbonIcon className={cn("h-4 w-4 transition-transform duration-200", isWishlisted ? "text-white scale-110" : "text-[#555555]")} />
        </button>
      </div>

      {/* Sold-out overlay */}
      {isSoldOut && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <Badge variant="sold_out" className="text-sm px-4 py-1.5">
            {locale === "ta" ? "விற்றுத் தீர்ந்தது" : "Sold Out"}
          </Badge>
        </div>
      )}

      {/* Book Cover */}
      <Link
        href={`/books/${book.slug}`}
        className={cn(
          "relative block overflow-hidden bg-gradient-to-b from-[#F7F5EF] via-[#EFEBE1] to-[#E8E4DA]",
          isHorizontal ? "w-full sm:w-44 shrink-0 flex items-center justify-center p-4 sm:p-5" : ""
        )}
        aria-label={locale === "ta" ? book.title : book.titleEn}
      >
        <div className={cn(
          "relative flex items-center justify-center",
          isCompact ? "py-4 px-3" : isHorizontal ? "p-0" : "py-6 px-5",
          isFeatured && "py-8 px-6"
        )}>
          <div className={cn(
            "relative rounded-lg overflow-hidden shadow-xl group-hover:scale-[1.03] transition-transform duration-500 motion-reduce:group-hover:scale-100",
            isCompact ? "w-24 aspect-[3/4]" : isHorizontal ? "w-32 sm:w-36 aspect-[3/4]" : "w-36 aspect-[3/4]",
            isFeatured && "w-44"
          )}>
            {/* Spine shadow for 3D tactile feel */}
            <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/35 via-black/10 to-transparent z-10 pointer-events-none" />
            {/* Page stack edge layering on the right */}
            <div className="absolute inset-y-1 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/20 to-transparent z-10 pointer-events-none" />
            
            <Image
              src={book.image}
              alt={locale === "ta" ? book.title : book.titleEn}
              fill
              sizes={isCompact ? "96px" : isFeatured ? "176px" : "144px"}
              className="object-cover"
            />
          </div>
        </div>
      </Link>

      {/* Card Body — Miller's Law: max 5 data points with generous optical text spacing */}
      <div className={cn(
        "flex flex-col flex-1",
        isHorizontal ? "p-4 sm:p-6 justify-between border-t sm:border-t-0 sm:border-l border-black/5 gap-3" : isCompact ? "p-3 gap-1.5 border-t border-black/5" : "p-4 sm:p-5 gap-2 border-t border-black/5"
      )}>
        <div className="space-y-1.5">
          {/* 1. Category badge */}
          <Badge variant="category" className="self-start text-[10px]">
            {locale === "ta" ? book.categoryTa : book.categoryEn}
          </Badge>

          {/* 2. Bilingual Title with zero clipping */}
          <Link href={`/books/${book.slug}`} className="group/title block">
            <h3 className={cn(
              "font-bold text-[#111111] group-hover/title:text-[#0A6847] transition-colors font-tamil leading-snug line-clamp-2",
              isCompact ? "text-xs" : isHorizontal ? "text-base sm:text-lg font-tamil-serif" : "text-sm sm:text-base"
            )}>
              {locale === "ta" ? book.title : book.titleEn}
            </h3>
            {/* Secondary language subtitle when viewing in opposite language */}
            {locale === "en" ? (
              <p className="text-[11px] text-[#777777] font-tamil truncate mt-0.5">
                {book.title}
              </p>
            ) : (
              <p className="text-[10px] text-[#777777] truncate mt-0.5" lang="en">
                {book.titleEn}
              </p>
            )}
          </Link>

          {/* 3. Author */}
          <p className={cn(
            "text-[#555555] font-medium font-tamil line-clamp-1",
            isCompact ? "text-[10px]" : "text-xs"
          )}>
            {locale === "ta" ? book.author : book.authorEn}
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-h-1" />

        {/* 4 & 5. Price + Add to Cart / Order on WhatsApp */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/5">
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "font-bold text-[#111111]",
              isCompact ? "text-sm" : "text-base sm:text-lg"
            )}>
              {formatINR(book.discountPrice ?? book.price)}
            </span>
            {book.discountPrice && (
              <span className="text-xs text-[#999999] line-through">
                {formatINR(book.price)}
              </span>
            )}
          </div>

          {!isSoldOut && (
            <a
              href={getWhatsAppOrderUrl(
                book.title,
                book.discountPrice ?? book.price,
                book.slug,
                1,
                getFormattedAddress()
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                locale === "ta"
                  ? `${book.title} — புலனம் (WhatsApp) வழியாக வாங்குக`
                  : `Order ${book.titleEn} on WhatsApp`
              }
              className="min-h-[44px] min-w-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 active:scale-95 motion-reduce:active:scale-100 shadow-xs font-tamil cursor-pointer"
            >
              <span>{locale === "ta" ? "வாங்க" : "Order"}</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

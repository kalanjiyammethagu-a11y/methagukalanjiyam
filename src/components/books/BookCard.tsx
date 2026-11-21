"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { BookmarkRibbonIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

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
  const router = useRouter();
  const { locale: contextLocale, isInWishlist, toggleWishlist, getFormattedAddress, showToast } = useLanguage();
  const { addToCart } = useCart();
  const locale = propLocale || contextLocale;
  const isWishlisted = isInWishlist(book.id);
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const isHorizontal = variant === "horizontal";
  const isSoldOut = book.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(book);
    } else {
      addToCart({
        id: book.id,
        title: book.title,
        titleEn: book.titleEn,
        author: book.author,
        authorEn: book.authorEn,
        price: book.discountPrice ?? book.price,
        image: book.image,
        slug: book.slug,
        quantity: 1,
        maxStock: book.stock || 10,
      });
    }
    showToast({
      type: "cart",
      titleTa: "கூடையில் சேர்க்கப்பட்டது",
      titleEn: "Added to Cart",
      messageTa: `"${book.title}" உங்கள் கூடையில் சேர்க்கப்பட்டது.`,
      messageEn: `"${book.titleEn}" was added to your cart.`,
      actionLabelTa: "கூடை காண்க",
      actionLabelEn: "View Cart",
      actionHref: "/cart",
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddToCart(e);
    router.push("/cart");
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-white border border-[#E5DFD5] rounded-lg overflow-hidden transition-all duration-200 hover:border-[#CFC6B8] hover:shadow-md",
        isHorizontal && "sm:flex-row items-stretch",
        isFeatured && "ring-1 ring-[#0D5C3A]/20",
        className
      )}
    >
      {/* Sold-out indicator banner (if out of stock) */}
      {isSoldOut && (
        <div className="absolute top-2 left-2 z-20">
          <Badge variant="sold_out" className="text-xs px-2.5 py-1">
            {locale === "ta" ? "விற்றுத் தீர்ந்தது" : "Sold Out"}
          </Badge>
        </div>
      )}

      {/* Unobstructed Book Cover with authentic paper spine shadow */}
      <Link
        href={`/books/${book.slug}`}
        className={cn(
          "relative block overflow-hidden bg-[#F7F5EF] border-b border-[#E5DFD5]",
          isHorizontal ? "w-full sm:w-44 shrink-0 sm:border-b-0 sm:border-r border-[#E5DFD5]" : ""
        )}
        aria-label={locale === "ta" ? book.title : book.titleEn}
      >
        <div
          className={cn(
            "relative flex items-center justify-center",
            isCompact ? "py-4 px-3" : isHorizontal ? "p-4 sm:p-5" : "py-6 px-5",
            isFeatured && "py-7 px-6"
          )}
        >
          <div
            className={cn(
              "relative rounded overflow-hidden shadow-sm transition-transform duration-200 group-hover:translate-y-[-2px]",
              isCompact ? "w-24 aspect-[3/4]" : isHorizontal ? "w-32 sm:w-36 aspect-[3/4]" : "w-36 sm:w-40 aspect-[3/4]",
              isFeatured && "w-44"
            )}
          >
            {/* Tactile Book Spine Depth Shadow */}
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 via-black/10 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/15 to-transparent z-10 pointer-events-none" />

            <Image
              src={book.image}
              alt={locale === "ta" ? `${book.title} - அட்டைப்படம்` : `${book.titleEn} cover artwork`}
              fill
              sizes={isCompact ? "96px" : isFeatured ? "176px" : "160px"}
              className="object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </Link>

      {/* Editorial Card Body (Metadata & Purchase Action) */}
      <div
        className={cn(
          "flex flex-col flex-1 p-4 sm:p-5 justify-between gap-3",
          isCompact && "p-3 gap-2"
        )}
      >
        <div className="space-y-1.5">
          {/* Header Row: Category Kicker + Bookmark Ribbon Action */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-[11px] font-bold text-[#0D5C3A]",
                locale === "ta" ? "font-tamil tracking-normal" : "uppercase tracking-wider font-sans"
              )}
            >
              {locale === "ta" ? book.categoryTa : book.categoryEn}
            </span>

            {/* Bookmark button with WCAG 44x44px touch area */}
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
                    ? `${book.title} — விருப்பப் பட்டியலிலிருந்து நீக்குக`
                    : `Remove ${book.titleEn} from saved library`
                  : locale === "ta"
                    ? `${book.title} — விருப்பப் பட்டியலில் சேர்க்க`
                    : `Save ${book.titleEn} to library`
              }
              className={cn(
                "relative min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center rounded-md transition-colors cursor-pointer",
                isWishlisted
                  ? "text-[#0D5C3A]"
                  : "text-[#665F57] hover:text-[#0D5C3A]"
              )}
              title={isWishlisted ? (locale === "ta" ? "சேமிக்கப்பட்டது" : "Saved") : (locale === "ta" ? "சேமிக்க" : "Save")}
            >
              <BookmarkRibbonIcon
                className={cn(
                  "h-4 w-4 transition-transform",
                  isWishlisted ? "text-[#0D5C3A] scale-110" : "text-[#665F57]"
                )}
              />
            </button>
          </div>

          {/* Book Title */}
          <Link href={`/books/${book.slug}`} className="group/title block">
            <h3
              className={cn(
                "font-bold text-[#191614] group-hover/title:text-[#0D5C3A] transition-colors leading-snug line-clamp-2",
                isCompact
                  ? "text-xs font-tamil"
                  : isHorizontal
                  ? "text-base sm:text-lg font-tamil-serif"
                  : "text-sm sm:text-base font-tamil-serif"
              )}
            >
              {locale === "ta" ? book.title : (book.titleEn || book.title)}
            </h3>

            {/* Subtitle: Only show secondary language when in horizontal layout and distinctly different */}
            {isHorizontal && book.titleEn && book.title !== book.titleEn && (
              <p className="text-xs text-[#665F57] truncate mt-0.5" lang={locale === "ta" ? "en" : "ta"}>
                {locale === "ta" ? book.titleEn : book.title}
              </p>
            )}
          </Link>

          {/* Author */}
          <p className="text-xs text-[#4A443E] font-medium font-tamil line-clamp-1">
            {locale === "ta" ? `ஆசிரியர்: ${book.author}` : `Author: ${book.authorEn}`}
          </p>
        </div>

        {/* Pricing & Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5DFD5]">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-[#191614] text-base sm:text-lg tabular-nums">
              {formatINR(book.discountPrice ?? book.price)}
            </span>
            {book.discountPrice && (
              <span className="text-xs text-[#665F57] line-through tabular-nums">
                {formatINR(book.price)}
              </span>
            )}
          </div>

          {!isSoldOut ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Quick Add to Cart Button (44x44px touch target) */}
              <button
                type="button"
                onClick={handleAddToCart}
                aria-label={
                  locale === "ta"
                    ? `${book.title} — கூடையில் சேர்க்க`
                    : `Add ${book.titleEn} to cart`
                }
                title={locale === "ta" ? "கூடையில் சேர்க்க" : "Add to Cart"}
                className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-lg border border-[#0D5C3A]/30 text-[#0D5C3A] hover:bg-[#0D5C3A]/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
              </button>

              {/* Direct On-Site Buy Button (Navigates to Cart / Checkout) */}
              <button
                type="button"
                onClick={handleBuyNow}
                aria-label={
                  locale === "ta"
                    ? `${book.title} — இப்போதே வாங்குக`
                    : `Buy ${book.titleEn} now`
                }
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0D5C3A] hover:bg-[#08442A] text-white flex items-center justify-center text-xs font-bold transition-colors font-tamil cursor-pointer active:bg-[#063320] shadow-xs"
              >
                <span>{locale === "ta" ? "வாங்க" : "Buy Now"}</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#665F57] font-semibold">
              {locale === "ta" ? "கையிருப்பில் இல்லை" : "Out of Stock"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

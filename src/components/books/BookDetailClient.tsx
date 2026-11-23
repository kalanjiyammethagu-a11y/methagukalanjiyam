"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Share2,
  CreditCard,
  ShoppingBag,
  Truck,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import {
  PostalSealIcon,
  ArchivalWaxSealIcon,
} from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatINR, cn } from "@/lib/utils";
import type { BookItem } from "@/data/books";

export interface BookDetailClientProps {
  book: BookItem;
}

/**
 * Action button below book cover (Share)
 */
export function BookCoverActions({ book }: { book: BookItem }) {
  const { locale } = useLanguage();
  const [copiedToast, setCopiedToast] = React.useState(false);
  const isTa = locale === "ta";

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: isTa ? book.title : book.titleEn,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <>
      {copiedToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-emerald-950 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-700 animate-in fade-in duration-200">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold font-tamil">
            {isTa ? "இணைப்பு நகலெடுக்கப்பட்டது!" : "Link copied to clipboard!"}
          </span>
        </div>
      )}

      <div className="flex items-center justify-center mt-6">
        <button
          type="button"
          onClick={handleShare}
          className="min-h-[44px] px-5 py-2.5 rounded-xl border border-black/10 flex items-center justify-center gap-2 text-zinc-600 hover:text-[#0A6847] hover:border-[#0A6847]/30 hover:bg-[#0A6847]/5 transition-colors cursor-pointer text-xs sm:text-sm font-medium font-tamil"
          aria-label={isTa ? "நூலைப் பகிர்க" : "Share this book"}
          title={isTa ? "நூலைப் பகிர்க" : "Share this book"}
        >
          <Share2 className="h-4 w-4" />
          <span>{isTa ? "நூலைப் பகிர்க" : "Share Book"}</span>
        </button>
      </div>
    </>
  );
}

/**
 * Main interactive unit for book detail:
 * Quantity selector, On-site checkout, Tabs switcher, and mobile sticky purchase bar
 */
export function BookDetailClient({ book }: BookDetailClientProps) {
  const router = useRouter();
  const { locale, getFormattedAddress, shippingRegion, showToast } = useLanguage();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<"description" | "details">("description");

  const isSoldOut = book.stock <= 0;
  const isLowStock = book.stock > 0 && book.stock <= 5;
  const isTa = locale === "ta";

  const handleAddToCart = () => {
    addToCart({
      id: book.id,
      title: book.title,
      titleEn: book.titleEn,
      author: book.author,
      authorEn: book.authorEn,
      price: book.discountPrice ?? book.price,
      image: book.image,
      slug: book.slug,
      quantity,
      maxStock: book.stock || 10,
    });
    showToast({
      type: "cart",
      titleTa: "கூடையில் சேர்க்கப்பட்டது",
      titleEn: "Added to Cart",
      messageTa: `"${book.title}" உங்கள் கூடையில் சேர்க்கப்பட்டது.`,
      messageEn: `"${book.titleEn}" (${quantity} item${quantity > 1 ? "s" : ""}) added to your cart.`,
      actionLabelTa: "கூடை காண்க",
      actionLabelEn: "View Cart",
      actionHref: "/cart",
    });
  };

  const handleBuyNow = () => {
    addToCart({
      id: book.id,
      title: book.title,
      titleEn: book.titleEn,
      author: book.author,
      authorEn: book.authorEn,
      price: book.discountPrice ?? book.price,
      image: book.image,
      slug: book.slug,
      quantity,
      maxStock: book.stock || 10,
    });
    router.push("/cart");
  };

  return (
    <>
      {/* Price & Primary CTA Unit */}
      <GlassPanel className="p-5 sm:p-6 rounded-2xl space-y-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-bold text-[#111111] font-mono">
              {formatINR(book.discountPrice ?? book.price)}
            </span>
            {book.discountPrice && (
              <span className="text-lg text-[#999999] line-through font-mono">
                {formatINR(book.price)}
              </span>
            )}
          </div>

          {/* Stock Status Badge (Binary: In Stock or Out of Stock only) */}
          <div>
            {isSoldOut ? (
              <Badge variant="sold_out">
                {isTa ? "கையிருப்பில் இல்லை" : "Out of Stock"}
              </Badge>
            ) : (
              <Badge variant="in_stock">
                <Check className="h-3 w-3" />
                <span>{isTa ? "இருப்பில் உள்ளது" : "In Stock"}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Quantity + Dual Purchase Actions */}
        {!isSoldOut && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <QuantitySelector
                value={quantity}
                min={1}
                max={book.stock}
                onChange={setQuantity}
                locale={locale}
              />
              <button
                type="button"
                onClick={handleAddToCart}
                className="min-h-[48px] px-5 rounded-2xl border-2 border-[#0A6847] text-[#0A6847] hover:bg-[#0A6847]/10 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] font-tamil cursor-pointer"
              >
                <ShoppingBag className="h-5 w-5 shrink-0" />
                <span>{isTa ? "கூடையில் சேர்" : "Add to Cart"}</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 min-h-[48px] px-6 rounded-2xl bg-[#0A6847] hover:bg-[#085237] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] font-tamil cursor-pointer"
              >
                <CreditCard className="h-5 w-5 shrink-0" />
                <span className="font-tamil">
                  {isTa
                    ? `இப்போதே வாங்குக (${formatINR((book.discountPrice ?? book.price) * quantity)})`
                    : `Buy Now (${formatINR((book.discountPrice ?? book.price) * quantity)})`}
                </span>
              </button>
            </div>

            {/* Fast Delivery Timeline Reassurance */}
            <div className="p-3 rounded-xl bg-black/[0.02] border border-black/8 flex items-center gap-2 text-xs text-zinc-700 font-tamil">
              <Truck className="h-4 w-4 text-[#0A6847] shrink-0" />
              <span>
                {isTa
                  ? "தமிழ்நாடு: 2-3 நாட்களில் ST கூரியர் / விரைவு அஞ்சல் வழி விரைவு வழங்கல்"
                  : "Tamil Nadu: 2-3 Days Fast Delivery via ST Courier / India Post"}
              </span>
            </div>

            {/* Trust Signals near Primary CTA */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[#555555] font-tamil">
              <Link
                href="/certificate"
                className="inline-flex items-center gap-1.5 text-[#0A6847] hover:underline font-semibold"
              >
                <ArchivalWaxSealIcon className="h-3.5 w-3.5" />
                <span>{isTa ? "அரசு MSME பதிவு: UDYAM-TN-18-0101323" : "Govt. MSME Verified"}</span>
              </Link>
              <Link
                href="/supporters"
                className="inline-flex items-center gap-1 text-[#555555] hover:text-[#111111] hover:underline"
              >
                <span>{isTa ? "களஞ்சிய ஆதரவாளர்கள் குழு" : "Archives Patrons"}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Shipping Fee Notice */}
        <div className="flex items-center gap-3 pt-3 border-t border-black/5 text-xs text-[#555555] font-medium">
          <PostalSealIcon className="h-4 w-4 text-[#0A6847] shrink-0" />
          <span className="font-tamil">
            {shippingRegion === "other-india"
              ? isTa
                ? "பிற இந்திய மாநிலங்களுக்கு ₹100 அஞ்சல் கட்டணம் • விரைவு அஞ்சல் வழி வழங்கல்"
                : "Flat ₹100 shipping to other Indian states via Speed Post"
              : shippingRegion === "diaspora"
              ? isTa
                ? "வெளிநாட்டுப் பார்சல் அஞ்சல் கட்டணம் எடைக்கேற்ப நிர்ணயிக்கப்படும் (DHL / India Post)"
                : "International diaspora shipping calculated by parcel weight via DHL / India Post"
              : isTa
              ? "தமிழ்நாடு முழுவதும் ₹60 அஞ்சல் கட்டணம் • ST கூரியர் / இந்திய அஞ்சல் வழி வழங்கல்"
              : "Flat ₹60 shipping across Tamil Nadu via ST Courier / India Post"}
          </span>
        </div>

        {/* Purchase Policy Notice: In-Site Purchase & Overseas Support */}
        <div className="p-2.5 rounded-xl bg-[#0A6847]/5 border border-[#0A6847]/15 flex items-start gap-2 text-xs text-[#0A6847] font-tamil">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-[#0A6847]" />
          <div className="leading-snug text-neutral-800">
            <span className="font-bold text-[#0A6847]">
              {isTa ? "இணையதள நேரடி கொள்முதல்:" : "On-Site Direct Purchase:"}{" "}
            </span>
            <span>
              {isTa
                ? "கூடையில் சேர்த்து UPI / Card மூலம் பாதுகாப்பாக வாங்கலாம்."
                : "Add to cart and purchase directly via UPI or Cards."}{" "}
            </span>
            <span className="text-neutral-500">
              {isTa
                ? "(வெளிநாட்டு வாசகர்கள் கூடையின் வழியே வாட்ஸ்அப்பில் தொடர்பு கொள்ளலாம்)."
                : "(Overseas orders are coordinated via WhatsApp from the cart)."}
            </span>
          </div>
        </div>
      </GlassPanel>

      {/* Tabs: Apple HIG Segmented Control */}
      <div className="space-y-4">
        <div
          className="p-1 rounded-2xl bg-black/[0.04] backdrop-blur-md border border-black/[0.08] flex items-center gap-1 w-fit shadow-2xs"
          role="tablist"
        >
          {(["description", "details"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "min-h-[40px] px-5 py-2 text-xs sm:text-sm font-semibold transition-all rounded-xl cursor-pointer font-tamil active:scale-[0.98]",
                activeTab === tab
                  ? "bg-[#0A6847] text-white shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
              )}
            >
              {tab === "description"
                ? isTa
                  ? "நூல் குறிப்பு (Synopsis)"
                  : "Synopsis"
                : isTa
                ? "ஆவண விவரக்குறிப்பு (Metadata)"
                : "Archival Specifications"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-2">
          {activeTab === "description" ? (
            <div className="prose prose-sm max-w-none space-y-4">
              {book.slug === "dhisai-thavara-kanai" && (
                <div className="relative w-36 aspect-[4/5] rounded-xl overflow-hidden sm:float-right sm:ml-4 mb-3 border border-black/10 shadow-md">
                  <Image
                    src="/images/books/thalapathi-vinayagam.webp"
                    alt="தளபதி விநாயகம் வரலாற்றுப் படம்"
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                </div>
              )}
              {book.author.includes("சாந்தி நேசக்கரம்") && (
                <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 mb-2">
                  <Image
                    src="/images/books/saanthi-nesakaram.webp"
                    alt="சாந்தி நேசக்கரம் பதிப்பக முத்திரை"
                    width={32}
                    height={28}
                    className="object-contain"
                  />
                  <span className="text-xs font-tamil font-bold text-amber-900">
                    {isTa ? "சாந்தி நேசக்கரம் வரலாற்றுப் பதிப்பகம்" : "Saanthi Nesakaram Archival Publication"}
                  </span>
                </div>
              )}
              <p className="text-sm sm:text-base text-[#222222] leading-[1.8] font-tamil whitespace-pre-line text-pretty">
                {isTa ? book.descriptionTa : book.descriptionEn}
              </p>
            </div>
          ) : (
            <div className="space-y-1 bg-white rounded-2xl border border-black/8 p-4">
              {[
                { labelTa: "நூல் பதிவு எண்", labelEn: "Archival ID", value: `MK-ARCH-${book.id.padStart(4, "0")}` },
                { labelTa: "வெளியீட்டு ஆண்டு", labelEn: "Publication Year", value: book.year },
                { labelTa: "பக்கங்களின் எண்ணிக்கை", labelEn: "Page Count", value: book.pages ? `${book.pages} பக்கங்கள்` : undefined },
                { labelTa: "பதிப்பகம்", labelEn: "Publisher", value: isTa ? book.publisher : book.publisherEn },
                { labelTa: "வகைப்பாடு", labelEn: "Taxonomy Genre", value: isTa ? book.categoryTa : book.categoryEn },
                { labelTa: "மொழி", labelEn: "Language", value: "தமிழ் (Tamil)" },
                { labelTa: "நூல் வடிவம்", labelEn: "Binding", value: isTa ? "அரிய ஆவண மறுபதிப்பு (Archival Monograph)" : "Archival Edition" },
                { labelTa: "ஆவண நம்பகத்தன்மை", labelEn: "Provenance", value: isTa ? "100% சரிபார்க்கப்பட்ட வரலாற்றுத் தரவு" : "100% Archival Verified" },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.labelEn} className="flex items-center justify-between py-2.5 border-b border-black/5 last:border-0 text-xs">
                    <span className="font-semibold text-[#555555] font-tamil shrink-0">
                      {isTa ? item.labelTa : item.labelEn}
                    </span>
                    <span className="font-bold text-[#111111] font-tamil text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          STICKY MOBILE ACTION BAR (Mobile Ergonomics & CRO)
          ============================================================ */}
      {!isSoldOut && (
        <aside
          aria-label={isTa ? "விரைவு வாங்கு பலகை" : "Quick Purchase Bar"}
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/10 px-4 py-2.5 sm:hidden flex items-center justify-between gap-2.5 shadow-2xl"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative h-11 w-8 rounded-lg overflow-hidden border border-black/10 shrink-0 shadow-2xs">
              <Image
                src={book.image}
                alt={book.title}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 truncate font-tamil leading-tight">
                {isTa ? book.title : book.titleEn}
              </div>
              <div className="text-xs font-black text-[#0A6847] font-mono mt-0.5">
                {formatINR(book.discountPrice ?? book.price)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile Sticky Add to Cart (44x44px touch target) */}
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={isTa ? "கூடையில் சேர்க்க" : "Add to Cart"}
              title={isTa ? "கூடையில் சேர்க்க" : "Add to Cart"}
              className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl border border-[#0A6847]/30 text-[#0A6847] bg-[#0A6847]/5 hover:bg-[#0A6847]/15 font-bold text-xs flex items-center justify-center active:scale-95 transition-all font-tamil cursor-pointer shrink-0"
            >
              <ShoppingBag className="h-4.5 w-4.5 shrink-0" />
            </button>

            {/* Mobile Sticky Buy Now */}
            <button
              type="button"
              onClick={handleBuyNow}
              aria-label={isTa ? "இப்போதே வாங்குக" : "Buy Now"}
              className="min-h-[44px] px-4 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 font-tamil cursor-pointer"
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              <span>{isTa ? "வாங்க" : "Buy Now"}</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

export default BookDetailClient;

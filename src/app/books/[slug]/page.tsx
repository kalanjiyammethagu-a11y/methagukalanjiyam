"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Share2,
  ShoppingBag,
  MessageCircle,
  Truck,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import {
  BookmarkRibbonIcon,
  PostalSealIcon,
  ArchivalWaxSealIcon,
} from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { BookCard, type BookCardData } from "@/components/books/BookCard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLanguage } from "@/context/LanguageContext";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getWhatsAppOrderUrl } from "@/lib/whatsapp";

import { allBooks, getBookBySlug, getRelatedBooks, type BookItem } from "@/data/books";

export default function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { locale, isInWishlist, toggleWishlist, getFormattedAddress, shippingRegion } = useLanguage();
  const [quantity, setQuantity] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<"description" | "details">("description");
  const [copiedToast, setCopiedToast] = React.useState(false);
  const resolvedParams = React.use(params);

  // Find book by slug from the catalog
  const book = getBookBySlug(resolvedParams.slug) || allBooks[0];
  const relatedBooks = getRelatedBooks(book);
  const isSoldOut = book.stock <= 0;
  const isLowStock = book.stock > 0 && book.stock <= 5;
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

  // Structured Data Schema for Book (SEO)
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    alternateName: book.titleEn,
    author: {
      "@type": "Person",
      name: book.author,
      alternateName: book.authorEn,
    },
    publisher: {
      "@type": "Organization",
      name: book.publisher || "மேதகு களஞ்சியம்",
      alternateName: "Methagu Kalanjiyam",
    },
    datePublished: book.year || "2024",
    numberOfPages: book.pages,
    inLanguage: "ta",
    image: `https://methagukalanjiyam.in${book.image}`,
    offers: {
      "@type": "Offer",
      price: book.discountPrice ?? book.price,
      priceCurrency: "INR",
      availability: isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "BookStore",
        name: "மேதகு களஞ்சியம்",
      },
    },
  };

  return (
    <div className="min-h-screen pb-24 sm:pb-16">
      {/* Book Schema.org Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />

      {/* Copy Toast */}
      {copiedToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-emerald-950 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-700 animate-in fade-in duration-200">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold font-tamil">
            {isTa ? "இணைப்பு நகலெடுக்கப்பட்டது!" : "Link copied to clipboard!"}
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          locale={locale}
          items={[
            { label: "நூல்கள்", labelEn: "Books", href: "/books" },
            { label: book.title, labelEn: book.titleEn },
          ]}
        />

        {/* ============================================================
            PRODUCT HERO — Z-Pattern Layout
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 sm:pb-16">

          {/* Left: Book Cover Gallery */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <GlassPanel className="p-6 sm:p-8 rounded-3xl">
                <div className="relative flex items-center justify-center">
                  <div className="relative w-56 sm:w-64 lg:w-72 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl">
                    {/* Spine shadow for 3D tactile feel */}
                    <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/30 via-black/5 to-transparent z-10 pointer-events-none" />
                    {/* Top light reflection */}
                    <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/20 to-transparent z-10 pointer-events-none" />
                    <Image
                      src={book.image}
                      alt={isTa ? book.title : book.titleEn}
                      fill
                      sizes="(max-width: 1024px) 280px, 320px"
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Action buttons below cover */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(book.id)}
                    className={cn(
                      "min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-[0.98] shadow-2xs",
                      isInWishlist(book.id)
                        ? "bg-[#0A6847] border-[#0A6847] text-white shadow-xs"
                        : "border-black/10 text-zinc-600 hover:text-[#0A6847] hover:border-[#0A6847]/30 hover:bg-[#0A6847]/5"
                    )}
                    aria-label={
                      isInWishlist(book.id)
                        ? isTa ? "வாசிப்புப் பட்டியலிலிருந்து நீக்குக" : "Remove from reading list"
                        : isTa ? "வாசிப்புப் பட்டியலில் சேர்" : "Bookmark this book"
                    }
                    title={isInWishlist(book.id) ? (isTa ? "சேமிக்கப்பட்டது" : "Saved") : (isTa ? "சேமிக்க" : "Save")}
                  >
                    <BookmarkRibbonIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl border border-black/10 flex items-center justify-center text-[#555555] hover:text-[#0A6847] hover:border-[#0A6847]/30 hover:bg-[#0A6847]/5 transition-colors cursor-pointer"
                    aria-label={isTa ? "பகிர்" : "Share"}
                    title={isTa ? "பகிர்" : "Share"}
                  >
                    <Share2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </GlassPanel>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Author Hierarchy */}
            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] font-tamil-serif leading-[1.3] text-balance">
                {isTa ? book.title : book.titleEn}
              </h1>
              {isTa ? (
                <p className="text-xs sm:text-sm text-[#666666] font-medium tracking-wide" lang="en">
                  {book.titleEn}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-[#666666] font-tamil font-medium">
                  {book.title}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Badge variant="category" className="text-xs">
                  {isTa ? book.categoryTa : book.categoryEn}
                </Badge>
                <span className="text-xs text-black/20" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base text-[#0A6847] font-bold font-tamil">
                  {isTa ? `ஆசிரியர்: ${book.author}` : `Author: ${book.authorEn}`}
                </p>
              </div>
            </div>

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

                {/* Stock Status Badge */}
                <div>
                  {isSoldOut ? (
                    <Badge variant="sold_out">
                      {isTa ? "விற்றுத் தீர்ந்தது" : "Sold Out"}
                    </Badge>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-400/40 text-xs font-bold font-tamil animate-pulse">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                      <span>{isTa ? `கடைசி ${book.stock} பிரதிகள்!` : `Only ${book.stock} left!`}</span>
                    </span>
                  ) : (
                    <Badge variant="in_stock">
                      <Check className="h-3 w-3" />
                      <span>{isTa ? `${book.stock} பிரதிகள் கையிருப்பு` : `${book.stock} in stock`}</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quantity + WhatsApp Order Action */}
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
                    <a
                      href={getWhatsAppOrderUrl(
                        book.title,
                        book.discountPrice ?? book.price,
                        book.slug,
                        quantity,
                        getFormattedAddress()
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-h-[48px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] font-tamil cursor-pointer"
                    >
                      <MessageCircle className="h-5 w-5 fill-white shrink-0" />
                      <span className="font-tamil">
                        {isTa
                          ? `வாட்ஸ்அப் வழி வாங்குக (${formatINR((book.discountPrice ?? book.price) * quantity)})`
                          : `Order on WhatsApp (${formatINR((book.discountPrice ?? book.price) * quantity)})`}
                      </span>
                    </a>
                  </div>

                  {/* Fast Delivery Timeline Reassurance */}
                  <div className="p-3 rounded-xl bg-black/[0.02] border border-black/8 flex items-center gap-2 text-xs text-zinc-700 font-tamil">
                    <Truck className="h-4 w-4 text-[#0A6847] shrink-0" />
                    <span>
                      {isTa
                        ? "தமிழ்நாடு: 2-3 நாட்களில் ST Courier / Speed Post மூலம் விரைவு டெலிவரி"
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
                      ? "பிற இந்திய மாநிலங்களுக்கு ₹100 அஞ்சல் கட்டணம் • Speed Post டெலிவரி"
                      : "Flat ₹100 shipping to other Indian states via Speed Post"
                    : shippingRegion === "diaspora"
                    ? isTa
                      ? "வெளிநாட்டுப் பார்சல் அஞ்சல் கட்டணம் எடைக்கேற்ப நிர்ணயிக்கப்படும் (DHL / India Post)"
                      : "International diaspora shipping calculated by parcel weight via DHL / India Post"
                    : isTa
                    ? "தமிழ்நாடு முழுவதும் ₹60 அஞ்சல் கட்டணம் • ST Courier / India Post டெலிவரி"
                    : "Flat ₹60 shipping across Tamil Nadu via ST Courier / India Post"}
                </span>
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
                      ? isTa ? "நூல் குறிப்பு (Synopsis)" : "Synopsis"
                      : isTa ? "ஆவண விவரக்குறிப்பு (Metadata)" : "Archival Specifications"}
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
          </div>
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="py-12 sm:py-16 border-t border-black/8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111111] font-tamil">
                {isTa ? "தொடர்புடைய வரலாற்று நூல்கள்" : "Related Historical Titles"}
              </h2>
              <Link
                href="/books"
                className="text-xs sm:text-sm font-bold text-[#0A6847] hover:underline font-tamil min-h-[44px] flex items-center"
              >
                {isTa ? "அனைத்தையும் காண்க" : "View All"}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedBooks.map((related) => (
                <BookCard
                  key={related.id}
                  book={related}
                  locale={locale}
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ============================================================
          STICKY MOBILE ACTION BAR (Mobile Ergonomics & CRO)
          ============================================================ */}
      {!isSoldOut && (
        <aside
          aria-label={isTa ? "விரைவு வாங்கு பலகை" : "Quick Purchase Bar"}
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/10 px-4 py-2.5 sm:hidden flex items-center justify-between gap-3 shadow-2xl"
          style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
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

          <a
            href={getWhatsAppOrderUrl(
              book.title,
              book.discountPrice ?? book.price,
              book.slug,
              quantity,
              getFormattedAddress()
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 shrink-0 font-tamil"
          >
            <MessageCircle className="h-4 w-4 fill-white" />
            <span>{isTa ? "வாங்குக" : "Order"}</span>
          </a>
        </aside>
      )}
    </div>
  );
}

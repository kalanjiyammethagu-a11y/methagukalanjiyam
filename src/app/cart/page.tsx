"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2, ArrowRight, BookOpen } from "lucide-react";
import { ArchivalWaxSealIcon, PostalSealIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLanguage } from "@/context/LanguageContext";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { BookCard } from "@/components/books/BookCard";
import { allBooks } from "@/data/books";

/* ============================================================
   CART STATE (demo data — production would use Zustand store)
   ============================================================ */
interface CartItem {
  id: string;
  title: string;
  titleEn: string;
  author: string;
  authorEn: string;
  price: number;
  image: string;
  slug: string;
  quantity: number;
  maxStock: number;
}

const initialCartItems: CartItem[] = [
  {
    id: "1",
    title: "கட்டுநாயக்கா தாக்குதல் வெற்றி",
    titleEn: "Katunayake Air Base Victory",
    author: "சாந்தி நேசக்கரம்",
    authorEn: "Saanthi Nesakaram",
    price: 100,
    image: "/images/books/book-20.webp",
    slug: "katunayake-attack-victory",
    quantity: 1,
    maxStock: 10,
  },
  {
    id: "2",
    title: "நெஞ்சுரம்",
    titleEn: "Nenjuram — Fortitude of Spirit",
    author: "துளசிச்செல்வன்",
    authorEn: "Thulasichelvan",
    price: 150,
    image: "/images/books/book-16.webp",
    slug: "nenjuram",
    quantity: 2,
    maxStock: 8,
  },
];

/* ============================================================
   PROGRESS STEPS (Zeigarnik Effect)
   ============================================================ */
function ProgressSteps({ current, locale }: { current: number; locale: "ta" | "en" }) {
  const steps = [
    { labelTa: "கூடை", labelEn: "Cart" },
    { labelTa: "முகவரி", labelEn: "Address" },
    { labelTa: "பணம்", labelEn: "Payment" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 py-6" aria-label={locale === "ta" ? "செயல் படிகள்" : "Checkout progress"}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                i < current
                  ? "bg-[#0A6847] text-white"
                  : i === current
                    ? "bg-[#0A6847] text-white ring-4 ring-[#0A6847]/15"
                    : "bg-black/8 text-[#999999]"
              )}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-semibold font-tamil hidden sm:inline",
                i <= current ? "text-[#111111]" : "text-[#999999]"
              )}
            >
              {locale === "ta" ? step.labelTa : step.labelEn}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "w-12 sm:w-20 h-0.5 mx-2 rounded-full transition-colors",
                i < current ? "bg-[#0A6847]" : "bg-black/10"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CartPage() {
  const { locale, shippingRegion, getFormattedAddress, openSettings } = useLanguage();
  const [items, setItems] = React.useState<CartItem[]>(initialCartItems);

  const updateQuantity = (id: string, newQty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = shippingRegion === "other-india" ? 100 : 60;
  const shipping = subtotal > 0 ? shippingFee : 0;
  const total = subtotal + shipping;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const isEmpty = items.length === 0;
  const formattedAddress = getFormattedAddress();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          locale={locale}
          items={[{ label: "கூடை", labelEn: "Cart" }]}
        />

        {/* Progress Steps — Zeigarnik Effect: shows incomplete journey */}
        <ProgressSteps current={0} locale={locale} />

        {/* Page Header */}
        <div className="pb-6 sm:pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] font-tamil tracking-tight">
              {locale === "ta" ? "உங்கள் கூடை" : "Your Cart"}
            </h1>
            {!isEmpty && (
              <p className="text-sm text-[#555555] font-medium font-tamil mt-1">
                {locale === "ta"
                  ? `${totalItems} புத்தகங்கள்`
                  : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          {!isEmpty && (
            <Link
              href="/books"
              className="text-xs sm:text-sm font-bold text-[#0A6847] hover:underline font-tamil min-h-[44px] flex items-center"
            >
              {locale === "ta" ? "நூல்களைத் தொடர்க" : "Continue Shopping"}
            </Link>
          )}
        </div>

        {isEmpty ? (
          <div className="space-y-12 pb-16">
            <EmptyState
              icon={<ShoppingBag className="h-10 w-10" />}
              titleTa="உங்கள் கூடை காலியாக உள்ளது"
              titleEn="Your cart is empty"
              descriptionTa="அரிய தமிழ் வரலாற்று நூல்களை உலாவி உங்கள் சேகரிப்பைத் தொடங்குங்கள்."
              descriptionEn="Browse our collection of rare Tamil historical books to start your archive."
              actionLabelTa="நூல்களை உலாவுக"
              actionLabelEn="Browse Books"
              actionHref="/books"
              locale={locale}
            />

            {/* Recommended Archival Books when empty — Zero Dead Ends */}
            <div className="pt-8 border-t border-black/8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-[#111111] font-tamil">
                  {locale === "ta" ? "பரிந்துரைக்கப்படும் வரலாற்று நூல்கள்" : "Recommended Historical Publications"}
                </h3>
                <Link
                  href="/books"
                  className="text-xs sm:text-sm font-bold text-[#0A6847] hover:underline font-tamil min-h-[44px] flex items-center"
                >
                  {locale === "ta" ? "அனைத்தையும் காண்க" : "View All"}
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {allBooks.slice(0, 4).map((book) => (
                  <BookCard key={book.id} book={book} locale={locale} variant="compact" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Cart Content — Cognitive Load minimized: item + qty + price grouped */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-16">

            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <GlassPanel key={item.id} className="p-4 sm:p-5 rounded-2xl">
                  <div className="flex gap-4">
                    {/* Book Cover */}
                    <Link
                      href={`/books/${item.slug}`}
                      className="shrink-0"
                    >
                      <div className="relative w-20 sm:w-24 aspect-[3/4] rounded-lg overflow-hidden bg-[#F5F3EF] border border-black/8 shadow-md hover:scale-[1.02] transition-transform">
                        <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />
                        <Image
                          src={item.image}
                          alt={locale === "ta" ? item.title : item.titleEn}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    </Link>

                    {/* Item Details — Gestalt Proximity */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="space-y-1">
                        <Link
                          href={`/books/${item.slug}`}
                          className="hover:text-[#0A6847] transition-colors"
                        >
                          <h3 className="text-sm sm:text-base font-bold text-[#111111] font-tamil line-clamp-2">
                            {locale === "ta" ? item.title : item.titleEn}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#555555] font-medium font-tamil line-clamp-1">
                          {locale === "ta" ? item.author : item.authorEn}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 mt-3">
                        {/* Quantity */}
                        <QuantitySelector
                          value={item.quantity}
                          min={1}
                          max={item.maxStock}
                          onChange={(v) => updateQuantity(item.id, v)}
                          locale={locale}
                          size="sm"
                        />

                        {/* Price + Remove */}
                        <div className="flex items-center gap-3">
                          <span className="text-base sm:text-lg font-bold text-[#111111] tabular-nums">
                            {formatINR(item.price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={
                              locale === "ta"
                                ? `${item.title} கூடையிலிருந்து நீக்கு`
                                : `Remove ${item.titleEn} from cart`
                            }
                            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] h-9 w-9 rounded-xl flex items-center justify-center text-[#999999] hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>

            {/* Order Summary — Sticky Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <GlassPanel className="p-5 sm:p-6 rounded-2xl space-y-5">
                  <h2 className="text-lg font-bold text-[#111111] font-tamil">
                    {locale === "ta" ? "ஆர்டர் சுருக்கம்" : "Order Summary"}
                  </h2>

                  {/* Price breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-[#333333] font-medium">
                      <span className="font-tamil">
                        {locale === "ta" ? "உட்கூட்டு" : "Subtotal"}
                      </span>
                      <span className="tabular-nums">{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#333333] font-medium">
                      <span className="font-tamil">
                        {locale === "ta" ? "தபால் கட்டணம்" : "Shipping"}
                      </span>
                      <span className="tabular-nums">
                        {shipping === 0
                          ? (locale === "ta" ? "இலவசம்" : "Free")
                          : formatINR(shipping)}
                      </span>
                    </div>
                    <p className="text-xs text-[#0A6847] font-medium font-tamil">
                      {shippingRegion === "other-india"
                        ? locale === "ta"
                          ? "பிற மாநிலங்கள்: ₹100 Speed Post நேரடி கண்காணிப்பு"
                          : "Other States: Flat ₹100 via Speed Post"
                        : locale === "ta"
                        ? "தமிழ்நாடு: ₹60 ST Courier / India Post விநியோகம்"
                        : "Tamil Nadu: Flat ₹60 via ST Courier / India Post"}
                    </p>
                    <div className="pt-3 border-t border-black/8 flex justify-between text-[#111111] font-bold text-base">
                      <span className="font-tamil">
                        {locale === "ta" ? "மொத்தம்" : "Total"}
                      </span>
                      <span className="tabular-nums text-lg">{formatINR(total)}</span>
                    </div>
                  </div>

                  {/* Delivery Address Preview Box */}
                  <div className="p-3.5 rounded-xl bg-black/[0.02] border border-black/8 space-y-1.5 font-tamil text-xs">
                    <div className="flex items-center justify-between text-[#111111] font-bold">
                      <span>{locale === "ta" ? "டெலிவரி முகவரி" : "Delivery Address"}</span>
                      <button
                        type="button"
                        onClick={openSettings}
                        className="text-[#0A6847] hover:underline font-semibold cursor-pointer"
                      >
                        {formattedAddress
                          ? locale === "ta" ? "மாற்றுக" : "Change"
                          : locale === "ta" ? "சேர்க்க" : "Add"}
                      </button>
                    </div>
                    {formattedAddress ? (
                      <p className="text-[#555555] whitespace-pre-line leading-relaxed font-sans text-xs">
                        {formattedAddress}
                      </p>
                    ) : (
                      <p className="text-[#888888] italic">
                        {locale === "ta"
                          ? "முகவரி சேர்க்கப்படவில்லை (வாட்ஸ்அப்பிலும் தெரிவிக்கலாம்)"
                          : "No saved address (you can also share in WhatsApp)"}
                      </p>
                    )}
                  </div>

                  {/* Checkout CTA — Direct WhatsApp Ordering */}
                  <a
                    href={`https://wa.me/916384654946?text=${encodeURIComponent(
                      `வணக்கம் மேதகு களஞ்சியம்,\nநான் பின்வரும் நூல்களை வாங்க விரும்புகிறேன்:\n${items
                        .map(
                          (item) =>
                            `• ${item.title} (${item.quantity} x ₹${item.price} = ₹${
                              item.price * item.quantity
                            })`
                        )
                        .join("\n")}\n\nநூல்கள் தொகை: ₹${subtotal}\nஅஞ்சல் கட்டணம்: ₹${shipping}\nமொத்தத் தொகை: ₹${total}${
                        formattedAddress
                          ? `\n\nஎன் அஞ்சல் முகவரி:\n${formattedAddress}`
                          : "\n\nஎன் முகவரி விவரங்களை அடுத்து அனுப்புகிறேன்."
                      }`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[48px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] font-tamil"
                  >
                    <span className="font-tamil">
                      {locale === "ta"
                        ? "வாட்ஸ்அப் வழி ஆர்டர் செய்க (Order on WhatsApp)"
                        : "Order on WhatsApp"}
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </a>

                  {/* Trust signals */}
                  <div className="space-y-2.5 pt-3 border-t border-black/5">
                    <Link
                      href="/certificate"
                      className="flex items-center gap-2.5 text-xs text-[#0A6847] hover:underline font-medium"
                    >
                      <ArchivalWaxSealIcon className="h-4 w-4 text-[#0A6847] shrink-0" />
                      <span className="font-tamil">
                        {locale === "ta"
                          ? "அரசு MSME பதிவு: UDYAM-TN-18-0101323"
                          : "Govt. MSME Verified: UDYAM-TN-18-0101323"}
                      </span>
                    </Link>
                    <div className="flex items-center gap-2.5 text-xs text-[#555555] font-medium">
                      <PostalSealIcon className="h-4 w-4 text-[#0A6847] shrink-0" />
                      <span className="font-tamil">
                        {locale === "ta"
                          ? "தமிழ்நாடு முழுவதும் ₹60 அஞ்சல் • ST Courier / India Post டெலிவரி"
                          : "Flat ₹60 shipping across TN via ST Courier / India Post"}
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

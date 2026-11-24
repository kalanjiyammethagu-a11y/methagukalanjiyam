"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Globe,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { ArchivalWaxSealIcon, PostalSealIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Price } from "@/components/ui/Price";
import { BookCard } from "@/components/books/BookCard";
import { RazorpayCheckout } from "@/components/checkout/RazorpayCheckout";
import { useLanguage, type ShippingRegion, type UserDeliveryAddress } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatINR, cn } from "@/lib/utils";
import { allBooks } from "@/data/books";

/* ============================================================
   PROGRESS STEPS (Zeigarnik Effect)
   ============================================================ */
function ProgressSteps({ current, locale }: { current: number; locale: "ta" | "en" }) {
  const steps = [
    { labelTa: "கூடை", labelEn: "Cart" },
    { labelTa: "அஞ்சல் முகவரி", labelEn: "Address" },
    { labelTa: "பணம்", labelEn: "Payment" },
  ];

  return (
    <div
      className="flex items-center justify-center gap-0 py-6"
      aria-label={locale === "ta" ? "செயல் படிகள்" : "Checkout progress"}
    >
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
                    : "bg-black/8 text-[#555555]"
              )}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-semibold font-tamil hidden sm:inline",
                i <= current ? "text-[#111111]" : "text-[#555555]"
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
  const router = useRouter();
  const {
    locale,
    shippingRegion,
    setShippingRegion,
    deliveryAddress,
    setDeliveryAddress,
    getFormattedAddress,
    showToast,
  } = useLanguage();

  const { items, updateQuantity, removeItem, addToCart, clearCart, subtotal, totalItems } = useCart();
  const [addressForm, setAddressForm] = React.useState<UserDeliveryAddress>(deliveryAddress);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  const [orderError, setOrderError] = React.useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = React.useState<{
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    amount: number;
  } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [userSession, setUserSession] = React.useState<{
    authenticated: boolean;
    user?: { id: string; email?: string; fullName?: string | null } | null;
  } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  const isTa = locale === "ta";

  // Check authenticated session for mandatory account ordering (No guest ordering)
  React.useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUserSession(data);
        } else {
          if (isMounted) setUserSession({ authenticated: false, user: null });
        }
      } catch {
        if (isMounted) setUserSession({ authenticated: false, user: null });
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync address form when global context changes
  React.useEffect(() => {
    setAddressForm(deliveryAddress);
  }, [deliveryAddress]);

  const validateField = (field: keyof UserDeliveryAddress, value: string): string | null => {
    switch (field) {
      case "fullName":
        if (!value.trim()) return isTa ? "பெறுநர் பெயரை உள்ளிடுக" : "Please enter recipient name";
        if (value.trim().length < 3) return isTa ? "குறைந்தது 3 எழுத்துக்கள் தேவை" : "Name must be at least 3 characters";
        return null;
      case "phone":
        if (!value.trim()) return isTa ? "கைபேசி எண்ணை உள்ளிடுக" : "Please enter mobile number";
        const cleanPhone = value.replace(/\D/g, "");
        if (cleanPhone.length < 10) return isTa ? "சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடுக" : "Enter a valid 10-digit phone number";
        return null;
      case "doorStreet":
        if (!value.trim()) return isTa ? "கதவு எண் மற்றும் தெரு முகவரி தேவை" : "Street address is required";
        return null;
      case "cityArea":
        if (!value.trim()) return isTa ? "நகரம் / ஊர் பெயர் தேவை" : "City / town is required";
        return null;
      case "pincode":
        if (!value.trim()) return isTa ? "அஞ்சல் குறியீட்டு எண் தேவை" : "Pincode is required";
        const cleanPin = value.replace(/\D/g, "");
        if (cleanPin.length !== 6) return isTa ? "சரியான 6 இலக்க பின்கோடு உள்ளிடுக" : "Enter a valid 6-digit postal code";
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (field: keyof UserDeliveryAddress) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, addressForm[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (errorMsg) next[field] = errorMsg;
      else delete next[field];
      return next;
    });
  };

  const handleAddressChange = (
    field: keyof UserDeliveryAddress,
    value: string
  ) => {
    const updated = { ...addressForm, [field]: value };
    setAddressForm(updated);
    setDeliveryAddress(updated);
    if (touched[field]) {
      const errorMsg = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (errorMsg) next[field] = errorMsg;
        else delete next[field];
        return next;
      });
    }
  };

  const handleRemoveWithUndo = (item: (typeof items)[0]) => {
    const previousQuantity = item.quantity;
    removeItem(item.id);
    showToast({
      type: "info",
      titleTa: "கூடையிலிருந்து நீக்கப்பட்டது",
      titleEn: "Item Removed",
      messageTa: `"${item.title}" கூடையிலிருந்து நீக்கப்பட்டது.`,
      messageEn: `"${item.titleEn}" was removed from your cart.`,
      actionLabelTa: "மீட்டெடு (Undo)",
      actionLabelEn: "Undo",
      onAction: () => {
        addToCart({ ...item, quantity: previousQuantity });
      },
    });
  };

  const isDiaspora = shippingRegion === "diaspora";
  const shippingFee =
    shippingRegion === "other-india" ? 100 : isDiaspora ? 0 : 60;
  const shipping = subtotal > 0 ? shippingFee : 0;
  const total = subtotal + shipping;
  const isEmpty = items.length === 0;

  const getOverseasWhatsAppUrl = () => {
    const booksList = items
      .map(
        (it) =>
          `• ${isTa ? it.title : it.titleEn} (x${it.quantity}) - ₹${it.price * it.quantity
          }`
      )
      .join("\n");
    const formattedAddr = getFormattedAddress();
    const addressStr = formattedAddr
      ? `\n\nஅஞ்சல் முகவரி (Postal Address):\n${formattedAddr}`
      : "";
    const msg = encodeURIComponent(
      `வணக்கம் மேதகு களஞ்சியம்,\nநான் வெளிநாட்டிலிருந்து (Overseas / International Order) நூல்களை வாங்க விரும்புகிறேன்.\n\n📚 கூடையில் உள்ள நூல்கள்:\n${booksList}\n\nமொத்த நூல் மதிப்பு: ₹${subtotal}${addressStr}\n\nதயவுசெய்து சர்வதேச அஞ்சல் கட்டணம் (DHL / International Post) மற்றும் கட்டண விவரங்களைத் தெரிவிக்கவும்.`
    );
    return `https://wa.me/916384654946?text=${msg}`;
  };

  // Validation
  const isAddressFilled = Boolean(
    addressForm.fullName.trim() &&
    addressForm.phone.trim().length >= 10 &&
    addressForm.doorStreet.trim() &&
    addressForm.pincode.trim().length >= 6
  );

  const currentStep = isEmpty ? 0 : isAddressFilled ? 2 : 1;

  // Initiate Online Checkout
  const handleInitiateOnlinePayment = async () => {
    if (isCreatingOrder) return;

    if (!userSession?.authenticated) {
      setOrderError(
        isTa
          ? "ஆர்டர் செய்ய வாசகர் கணக்கில் உள்நுழையவும் (விருந்தினர் ஆர்டர் அனுமதி இல்லை)."
          : "Account required. Please sign in or create an account to order (No guest ordering)."
      );
      router.push("/login?redirect=/cart");
      return;
    }

    if (!isAddressFilled) {
      setOrderError(
        isTa
          ? "தயவுசெய்து உங்கள் அஞ்சல் முகவரி, தொலைபேசி மற்றும் பின்கோடை முழுமையாக உள்ளிடவும்."
          : "Please complete your full delivery address and mobile number before proceeding."
      );
      return;
    }

    setIsCreatingOrder(true);
    setOrderError(null);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            book_id: item.id,
            quantity: item.quantity,
            price: item.price,
            title: item.title,
            cover_url: item.image,
          })),
          shipping_address: {
            full_name: addressForm.fullName,
            phone: addressForm.phone,
            house_name: addressForm.doorStreet,
            street: addressForm.doorStreet,
            city: addressForm.cityArea || "Tamil Nadu",
            state: addressForm.districtState || "Tamil Nadu",
            pincode: addressForm.pincode,
          },
          is_guest_checkout: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || data.requiresAuth) {
          router.push("/login?redirect=/cart");
          throw new Error(
            isTa
              ? "ஆர்டர் செய்ய உங்கள் கணக்கில் உள்நுழைய வேண்டும்."
              : "Please sign in or create an account to complete your order."
          );
        }
        throw new Error(data.error || "Order creation failed on server");
      }

      setCreatedOrder({
        orderId: data.order_id,
        orderNumber: data.order_number,
        razorpayOrderId: data.razorpay_order_id,
        amount: data.amount,
      });
    } catch (err: any) {
      console.error("Order creation failed:", err);
      setOrderError(
        err.message ||
        (isTa
          ? "ஆர்டர் உருவாக்குவதில் பிழை ஏற்பட்டது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்."
          : "Failed to create order on server. Please try again.")
      );
      setCreatedOrder(null);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="min-h-[100dvh] pb-36 sm:pb-32 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          locale={locale}
          items={[{ label: "கூடை", labelEn: "Cart" }]}
        />

        {/* Progress Steps — Zeigarnik Effect */}
        <ProgressSteps current={currentStep} locale={locale} />

        {/* Page Header */}
        <div className="pb-6 sm:pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] font-tamil tracking-tight">
              {isTa ? "உங்கள் கூடை" : "Your Cart"}
            </h1>
            {!isEmpty && (
              <p className="text-sm text-[#555555] font-medium font-tamil mt-1">
                {isTa
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
              {isTa ? "நூல்களைத் தொடர்க" : "Continue Shopping"}
            </Link>
          )}
        </div>

        {paymentSuccess ? (
          <GlassPanel className="max-w-lg mx-auto p-8 sm:p-10 rounded-3xl text-center space-y-5 bg-white/95 border border-emerald-500/30 shadow-xl my-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] font-tamil">
              {isTa ? "ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டது!" : "Order Confirmed!"}
            </h2>
            <p className="text-xs sm:text-sm text-[#444444] font-tamil leading-relaxed">
              {isTa
                ? "உங்கள் கட்டணம் பெறப்பட்டு பார்சல் தயாரிப்புக்கு அனுப்பப்பட்டுள்ளது. SMS & WhatsApp வழியாக நேரடி டிராக்கிங் எண் விரைவில் அனுப்பப்படும்."
                : "Your payment has been verified and your package is being prepared for postal dispatch. A tracking number will be sent via SMS/WhatsApp."}
            </p>
            <div className="pt-2">
              <Link
                href="/books"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0A6847] text-white font-bold text-sm font-tamil shadow-sm hover:bg-[#085036]"
              >
                {isTa ? "மேலும் நூல்களை உலாவுக" : "Continue Browsing"}
              </Link>
            </div>
          </GlassPanel>
        ) : isEmpty ? (
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
                  {isTa
                    ? "பரிந்துரைக்கப்படும் வரலாற்று நூல்கள்"
                    : "Recommended Historical Publications"}
                </h3>
                <Link
                  href="/books"
                  className="text-xs sm:text-sm font-bold text-[#0A6847] hover:underline font-tamil min-h-[44px] flex items-center"
                >
                  {isTa ? "அனைத்தையும் காண்க" : "View All"}
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {allBooks.slice(0, 4).map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    locale={locale}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-16">
            {/* Left Column: Cart Items & Inline Address Form */}
            <div className="lg:col-span-8 space-y-6">
              {/* Cart Items List */}
              <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-[#111111] font-tamil">
                  {isTa ? "தேர்ந்தெடுக்கப்பட்ட நூல்கள்" : "Selected Publications"}
                </h2>

                {items.map((item) => (
                  <GlassPanel key={item.id} className="p-3.5 sm:p-5 rounded-2xl">
                    <div className="flex flex-col min-[380px]:flex-row gap-3 sm:gap-4">
                      {/* Book Cover */}
                      <Link href={`/books/${item.slug}`} className="shrink-0 self-start">
                        <div className="relative w-16 min-[380px]:w-20 sm:w-24 aspect-[3/4] rounded-lg overflow-hidden bg-[#F5F3EF] dark:bg-zinc-800 border border-black/8 dark:border-white/10 shadow-md hover:scale-[1.02] transition-transform">
                          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />
                          <Image
                            src={item.image || "/images/books/book-placeholder.webp"}
                            alt={isTa ? item.title : item.titleEn}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                      </Link>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <Link
                            href={`/books/${item.slug}`}
                            className="hover:text-[#0A6847] dark:hover:text-emerald-400 transition-colors"
                          >
                            <h3 className="text-sm sm:text-base font-bold text-[#111111] dark:text-zinc-100 font-tamil line-clamp-2">
                              {isTa ? item.title : item.titleEn}
                            </h3>
                          </Link>
                          <p className="text-xs text-[#555555] dark:text-zinc-400 font-medium font-tamil line-clamp-1">
                            {isTa ? item.author : item.authorEn}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2.5 border-t border-black/5 min-[380px]:border-t-0 min-[380px]:pt-0">
                          {/* Quantity Selector */}
                          <QuantitySelector
                            value={item.quantity}
                            min={1}
                            max={item.maxStock}
                            onChange={(v) => updateQuantity(item.id, v)}
                            locale={locale}
                            size="sm"
                          />

                          {/* Price + Remove Button */}
                          <div className="flex items-center gap-3">
                            <Price
                              amount={item.price * item.quantity}
                              size="md"
                              className="sm:text-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveWithUndo(item)}
                              aria-label={
                                isTa
                                  ? `${item.title} கூடையிலிருந்து நீக்கு`
                                  : `Remove ${item.titleEn} from cart`
                              }
                              title={isTa ? "கூடையிலிருந்து நீக்கு" : "Remove item"}
                              className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl flex items-center justify-center text-[#666666] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 transition-all cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
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

              {/* Mandatory Account Verification Notice (No Guest Ordering) */}
              {!isCheckingAuth && !userSession?.authenticated && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 font-tamil">
                        {isTa
                          ? "ஆர்டர் செய்ய வாசகர் கணக்கில் நுழையவும்"
                          : "Sign In Required to Place Order"}
                      </h3>
                      <p className="text-xs text-amber-900/80 dark:text-amber-300/80 font-tamil mt-1 leading-relaxed">
                        {isTa
                          ? "அஞ்சல் கண்காணிப்பு மற்றும் பாதுகாப்பான விநியோகத்திற்கு வாசகர் கணக்கு கட்டாயமாகும் (விருந்தினர் ஆர்டர் அனுமதி இல்லை)."
                          : "An authenticated account is required to dispatch and track your parcel. Guest ordering is disabled."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <Link
                      href="/login?redirect=/cart"
                      className="flex-1 min-h-[44px] py-2 px-4 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs sm:text-sm font-bold font-tamil flex items-center justify-center shadow-xs transition-all active:scale-98"
                    >
                      {isTa ? "உள்நுழைக (Sign In)" : "Sign In"}
                    </Link>
                    <Link
                      href="/signup?redirect=/cart"
                      className="flex-1 min-h-[44px] py-2 px-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 text-xs sm:text-sm font-bold font-tamil flex items-center justify-center shadow-2xs transition-all active:scale-98"
                    >
                      {isTa ? "புதிய கணக்கு (Create Account)" : "Create Account"}
                    </Link>
                  </div>
                </div>
              )}

              {!isCheckingAuth && userSession?.authenticated && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs font-tamil">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-[#0A6847]" />
                    <span>
                      {isTa
                        ? `உள்நுழைந்துள்ளீர்கள்: ${userSession.user?.fullName || userSession.user?.email}`
                        : `Signed in as: ${userSession.user?.fullName || userSession.user?.email}`}
                    </span>
                  </div>
                  <Link href="/account" className="text-[#0A6847] font-bold hover:underline">
                    {isTa ? "என் கணக்கு" : "My Account"}
                  </Link>
                </div>
              )}

              {/* Inline Delivery Address Form */}
              <GlassPanel id="delivery-address-section" className="p-5 sm:p-6 rounded-2xl space-y-5 scroll-mt-24">
                <div className="flex items-center justify-between border-b border-black/8 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-[#0A6847]/10 flex items-center justify-center text-[#0A6847]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#111111] font-tamil">
                        {isTa ? "அஞ்சல் முகவரி" : "Postal Delivery Address"}
                      </h2>
                      <p className="text-xs text-[#666666] font-tamil">
                        {isTa
                          ? "நூல்கள் பாதுகாப்பாக அனுப்பப்பட வேண்டிய அஞ்சல் முகவரியை உள்ளிடுக"
                          : "Enter destination address for secure postal dispatch"}
                      </p>
                    </div>
                  </div>
                  {isAddressFilled && (
                    <span className="text-xs font-bold text-[#0A6847] flex items-center gap-1 font-tamil">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{isTa ? "பூர்த்தி செய்யப்பட்டது" : "Completed"}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "பெறுநர் பெயர் (Full Name) *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      value={addressForm.fullName}
                      onChange={(e) => handleAddressChange("fullName", e.target.value)}
                      onBlur={() => handleBlur("fullName")}
                      aria-invalid={Boolean(touched.fullName && errors.fullName)}
                      placeholder={isTa ? "எ.கா. வே. தமிழரசன்" : "e.g. Tamilarasan"}
                      className={cn(
                        "w-full px-3.5 py-2 rounded-xl border bg-white text-base sm:text-sm font-tamil text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 min-h-[44px] transition-colors",
                        touched.fullName && errors.fullName
                          ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                          : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                      )}
                    />
                    {touched.fullName && errors.fullName && (
                      <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "கைபேசி எண் (Mobile Phone) *" : "Phone Number *"}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={addressForm.phone}
                      onChange={(e) => handleAddressChange("phone", e.target.value)}
                      onBlur={() => handleBlur("phone")}
                      aria-invalid={Boolean(touched.phone && errors.phone)}
                      placeholder="82486 54946"
                      className={cn(
                        "w-full px-3.5 py-2 rounded-xl border bg-white text-base sm:text-sm font-mono text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 min-h-[44px] transition-colors",
                        touched.phone && errors.phone
                          ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                          : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                      )}
                    />
                    {touched.phone && errors.phone && (
                      <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Door / Street */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "கதவு எண், தெரு / குடியிருப்பு முகவரி *" : "Door No, Street & Area *"}
                    </label>
                    <input
                      type="text"
                      name="street-address"
                      autoComplete="street-address"
                      required
                      value={addressForm.doorStreet}
                      onChange={(e) => handleAddressChange("doorStreet", e.target.value)}
                      onBlur={() => handleBlur("doorStreet")}
                      aria-invalid={Boolean(touched.doorStreet && errors.doorStreet)}
                      placeholder={isTa ? "எ.கா. 12/4, பாரதி தெரு, கானார்பட்டி" : "e.g. 12/4, Bharathi Street"}
                      className={cn(
                        "w-full px-3.5 py-2 rounded-xl border bg-white text-base sm:text-sm font-tamil text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 min-h-[44px] transition-colors",
                        touched.doorStreet && errors.doorStreet
                          ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                          : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                      )}
                    />
                    {touched.doorStreet && errors.doorStreet && (
                      <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.doorStreet}</span>
                      </p>
                    )}
                  </div>

                  {/* City / Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "ஊர் / நகரம் (City / Town) *" : "City / Town *"}
                    </label>
                    <input
                      type="text"
                      name="address-level2"
                      autoComplete="address-level2"
                      required
                      value={addressForm.cityArea}
                      onChange={(e) => handleAddressChange("cityArea", e.target.value)}
                      onBlur={() => handleBlur("cityArea")}
                      aria-invalid={Boolean(touched.cityArea && errors.cityArea)}
                      placeholder={isTa ? "திருநெல்வேலி / சென்னை" : "Tirunelveli / Chennai"}
                      className={cn(
                        "w-full px-3.5 py-2 rounded-xl border bg-white text-base sm:text-sm font-tamil text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 min-h-[44px] transition-colors",
                        touched.cityArea && errors.cityArea
                          ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                          : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                      )}
                    />
                    {touched.cityArea && errors.cityArea && (
                      <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.cityArea}</span>
                      </p>
                    )}
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "அஞ்சல் குறியீட்டு எண் (Postal Pincode) *" : "Pincode *"}
                    </label>
                    <input
                      type="text"
                      name="postal-code"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      required
                      value={addressForm.pincode}
                      onChange={(e) => handleAddressChange("pincode", e.target.value)}
                      onBlur={() => handleBlur("pincode")}
                      aria-invalid={Boolean(touched.pincode && errors.pincode)}
                      placeholder="627201"
                      className={cn(
                        "w-full px-3.5 py-2 rounded-xl border bg-white text-base sm:text-sm font-mono text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:ring-2 min-h-[44px] transition-colors",
                        touched.pincode && errors.pincode
                          ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                          : "border-black/12 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                      )}
                    />
                    {touched.pincode && errors.pincode && (
                      <p className="text-xs text-rose-600 font-tamil flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.pincode}</span>
                      </p>
                    )}
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Right Column: Order Summary, Shipping Region Selection & Payment Actions */}
            <div id="order-summary-section" className="lg:col-span-4 scroll-mt-24">
              <div className="sticky top-24 space-y-4">
                <GlassPanel className="p-5 sm:p-6 rounded-2xl space-y-5">
                  <h2 className="text-lg font-bold text-[#111111] font-tamil">
                    {isTa ? "ஆர்டர் சுருக்கம்" : "Order Summary"}
                  </h2>

                  {/* Shipping Region Selection */}
                  <div className="space-y-2 pt-1 border-t border-black/6">
                    <label className="text-xs font-bold text-[#222222] font-tamil block">
                      {isTa ? "தபால் விநியோக மண்டலம் (Shipping Region):" : "Shipping Destination:"}
                    </label>
                    <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Shipping region">
                      {[
                        {
                          id: "tamil-nadu" as ShippingRegion,
                          titleTa: "தமிழ்நாடு (Tamil Nadu)",
                          titleEn: "Tamil Nadu",
                          feeText: "₹60",
                          courier: "ST Courier / Speed Post",
                        },
                        {
                          id: "other-india" as ShippingRegion,
                          titleTa: "பிற இந்திய மாநிலங்கள் (Other States)",
                          titleEn: "Other States",
                          feeText: "₹100",
                          courier: "Speed Post",
                        },
                        {
                          id: "diaspora" as ShippingRegion,
                          titleTa: "வெளிநாடு (Diaspora / International)",
                          titleEn: "International Diaspora",
                          feeText: isTa ? "WhatsApp" : "WhatsApp",
                          courier: "DHL / India Post (Overseas)",
                        },
                      ].map((reg) => {
                        const isSelected = shippingRegion === reg.id;
                        return (
                          <button
                            key={reg.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setShippingRegion(reg.id)}
                            className={cn(
                              "p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer font-tamil min-h-[44px] touch-manipulation",
                              isSelected
                                ? "border-[#0A6847] bg-[#0A6847]/8 shadow-2xs ring-1 ring-[#0A6847]/20"
                                : "border-black/10 bg-white/70 hover:bg-white"
                            )}
                          >
                            <div>
                              <div className="font-bold text-[#111111]">
                                {isTa ? reg.titleTa : reg.titleEn}
                              </div>
                              <div className="text-[10px] text-[#555555]">{reg.courier}</div>
                            </div>
                            <div className="font-mono font-bold text-[#0A6847]">
                              {reg.feeText}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 text-sm pt-2 border-t border-black/8">
                    <div className="flex justify-between text-[#333333] font-medium">
                      <span className="font-tamil">
                        {isTa ? "உட்கூட்டு" : "Subtotal"}
                      </span>
                      <Price amount={subtotal} />
                    </div>

                    <div className="flex justify-between text-[#333333] font-medium">
                      <span className="font-tamil">
                        {isTa ? "தபால் கட்டணம்" : "Shipping"}
                      </span>
                      {isDiaspora ? (
                        <span className="font-mono text-xs font-semibold text-[#0A6847]">
                          {isTa ? "எடைக்கேற்ப" : "By Weight"}
                        </span>
                      ) : shipping === 0 ? (
                        <Price amount={0} showFree />
                      ) : (
                        <Price amount={shipping} />
                      )}
                    </div>

                    <div
                      className="pt-3 border-t border-black/8 flex justify-between items-baseline text-[#111111] font-bold text-base"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <span className="font-tamil">
                        {isTa ? "மொத்தம்" : "Total"}
                      </span>
                      {isDiaspora ? (
                        <span className="text-lg font-mono text-[#0A6847]">
                          <Price amount={subtotal} size="lg" className="text-[#0A6847]" />{" "}
                          <span className="text-xs font-normal text-[#555555]">
                            {isTa ? "+ அஞ்சல்" : "+ Shipping"}
                          </span>
                        </span>
                      ) : (
                        <Price amount={total} size="xl" className="text-[#0A6847]" />
                      )}
                    </div>
                  </div>

                  {/* Checkout Action: Overseas WhatsApp OR Domestic In-Site Payment */}
                  <div className="space-y-3 pt-2">
                    {orderError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span className="font-tamil">{orderError}</span>
                      </div>
                    )}

                    {isDiaspora ? (
                      /* OVERSEAS DIASPORA: WhatsApp Inquire & Order */
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 text-xs font-tamil space-y-1.5">
                          <div className="flex items-center gap-2 font-bold text-amber-950">
                            <Globe className="h-4 w-4 text-amber-700 shrink-0" />
                            <span>
                              {isTa
                                ? "வெளிநாட்டு வாசகர்கள் கவனத்திற்கு (Overseas Orders)"
                                : "Overseas / International Diaspora Orders"}
                            </span>
                          </div>
                          <p className="text-amber-900 leading-relaxed text-[11px] sm:text-xs">
                            {isTa
                              ? "வெளிநாட்டு அஞ்சல் சேவைக்கு (DHL / International Post) பார்சல் எடை மற்றும் நாட்டின் அடிப்படையில் தபால் கட்டணம் நிர்ணயிக்கப்படும். உங்கள் கூடைப் புத்தகங்களுடன் எங்களின் அதிகாரப்பூர்வ WhatsApp மூலம் தொடர்பு கொள்ளவும்."
                              : "For international orders, shipping charges are calculated based on parcel weight and destination country (via DHL / India Post). Please proceed via WhatsApp with your cart items."}
                          </p>
                        </div>

                        <a
                          href={getOverseasWhatsAppUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[48px] px-6 rounded-2xl bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] cursor-pointer font-tamil"
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span>
                            {isTa
                              ? "WhatsApp வழியே வெளிநாட்டு ஆர்டர் செய்க"
                              : "Inquire Overseas Order on WhatsApp"}
                          </span>
                        </a>
                      </div>
                    ) : (
                      /* DOMESTIC: Strictly In-Site Online Payment */
                      <>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#0A6847] bg-[#0A6847]/8 border border-[#0A6847]/20 px-3 py-2 rounded-xl font-tamil">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-[#0A6847]" />
                          <span>
                            {isTa
                              ? "பாதுகாப்பான இணையதள நேரடி கட்டணம் (UPI / GPay / Card)"
                              : "100% Secure In-Site Payment (UPI, Cards, NetBanking)"}
                          </span>
                        </div>

                        {createdOrder ? (
                          <RazorpayCheckout
                            orderId={createdOrder.orderId}
                            orderNumber={createdOrder.orderNumber}
                            razorpayOrderId={createdOrder.razorpayOrderId}
                            amount={createdOrder.amount}
                            prefill={{
                              name: addressForm.fullName,
                              contact: addressForm.phone,
                            }}
                            notes={{
                              address: getFormattedAddress(),
                              shipping_region: shippingRegion,
                            }}
                            buttonText={
                              isTa
                                ? `ஆன்லைனில் பணம் செலுத்துக (${formatINR(total)})`
                                : `Pay Online (${formatINR(total)})`
                            }
                            buttonClassName="w-full min-h-[48px] bg-[#0A6847] hover:bg-[#085036] text-white font-bold rounded-2xl"
                            onSuccess={() => {
                              const orderNum = createdOrder?.orderNumber;
                              clearCart();
                              if (orderNum) {
                                router.push(`/orders/${orderNum}`);
                              } else {
                                setPaymentSuccess(true);
                              }
                            }}
                            onFailure={(err) => {
                              setOrderError(err.error?.description || "Payment failed");
                            }}
                          />
                        ) : !isCheckingAuth && !userSession?.authenticated ? (
                          <Link
                            href="/login?redirect=/cart"
                            className="w-full min-h-[48px] px-6 rounded-2xl bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] cursor-pointer font-tamil"
                          >
                            <CreditCard className="h-5 w-5" />
                            <span>
                              {isTa
                                ? "உள்நுழைந்து பணம் செலுத்துக"
                                : `Sign In to Pay (${formatINR(total)})`}
                            </span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={handleInitiateOnlinePayment}
                            disabled={isCreatingOrder || isCheckingAuth}
                            className="w-full min-h-[48px] px-6 rounded-2xl bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 font-tamil"
                          >
                            {isCreatingOrder ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>தயாராகிறது...</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-5 w-5" />
                                <span>
                                  {isTa
                                    ? `ஆன்லைனில் செலுத்துக (UPI / Card - ${formatINR(total)})`
                                    : `Pay via UPI / Card (${formatINR(total)})`}
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Trust Signals */}
                  <div className="space-y-2.5 pt-3 border-t border-black/5 text-xs">
                    <Link
                      href="/certificate"
                      className="flex items-center gap-2 text-[#0A6847] hover:underline font-medium"
                    >
                      <ArchivalWaxSealIcon className="h-4 w-4 text-[#0A6847] shrink-0" />
                      <span className="font-tamil">
                        {isTa
                          ? "அரசு MSME பதிவு: UDYAM-TN-18-0101323"
                          : "Govt. MSME Verified: UDYAM-TN-18-0101323"}
                      </span>
                    </Link>
                    <div className="flex items-center gap-2 text-[#555555] font-medium">
                      <PostalSealIcon className="h-4 w-4 text-[#0A6847] shrink-0" />
                      <span className="font-tamil">
                        {shippingRegion === "other-india"
                          ? isTa
                            ? "Speed Post நேரடி டிராக்கிங் AWB எண் வழங்கப்படும்"
                            : "Speed Post Live AWB Tracking Provided"
                          : isTa
                            ? "ST Courier / Speed Post நேரடி பார்சல் டிராக்கிங்"
                            : "ST Courier / Speed Post Fast Dispatch"}
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        )}

        {/* Mobile & Tablet Sticky Checkout Bar (Always thumb-reachable, hidden on desktop) */}
        {!isEmpty && !paymentSuccess && (
          <aside
            aria-label={isTa ? "விரைவு கட்டணப் பலகை" : "Sticky Checkout Bar"}
            className={cn(
              "lg:hidden fixed left-0 right-0 z-30 bg-white/95 dark:bg-[#121110]/95 backdrop-blur-xl border-t border-black/10 dark:border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all duration-300",
              "bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:bottom-0 md:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
              "px-4 py-2.5 max-[500px]:py-1.5"
            )}
          >
            <div className="max-w-md mx-auto flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-[#555555] dark:text-zinc-400 font-tamil leading-tight">
                  {isTa ? `மொத்தம் (${totalItems} நூல்கள்)` : `Total (${totalItems} items)`}
                </div>
                <div className="text-base sm:text-lg font-bold text-[#0A6847] dark:text-emerald-400 font-mono leading-none mt-0.5 tabular-nums">
                  {isDiaspora ? (
                    <span>
                      {formatINR(subtotal)}{" "}
                      <span className="text-[10px] font-normal text-[#555555] dark:text-zinc-400">
                        {isTa ? "+ அஞ்சல்" : "+ Shipping"}
                      </span>
                    </span>
                  ) : (
                    formatINR(total)
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {isDiaspora ? (
                  <a
                    href={getOverseasWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all font-tamil touch-manipulation cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span>{isTa ? "WhatsApp ஆர்டர்" : "WhatsApp"}</span>
                  </a>
                ) : createdOrder ? (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("order-summary-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all font-tamil touch-manipulation cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span>{isTa ? "பணம் செலுத்துக" : "Complete Pay"}</span>
                  </button>
                ) : !isCheckingAuth && !userSession?.authenticated ? (
                  <Link
                    href="/login?redirect=/cart"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all font-tamil touch-manipulation cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span>{isTa ? "உள்நுழைக" : "Sign In to Pay"}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAddressFilled) {
                        const addressSection = document.getElementById("delivery-address-section");
                        addressSection?.scrollIntoView({ behavior: "smooth" });
                        const firstInput = addressSection?.querySelector("input");
                        firstInput?.focus();
                      } else {
                        handleInitiateOnlinePayment();
                      }
                    }}
                    disabled={isCreatingOrder || isCheckingAuth}
                    className="min-h-[44px] px-4 sm:px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all font-tamil touch-manipulation cursor-pointer disabled:opacity-60"
                  >
                    {isCreatingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        <span>தயாராகிறது...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 shrink-0" />
                        <span>
                          {isAddressFilled
                            ? isTa
                              ? "ஆர்டர் செய்க"
                              : "Place Order"
                            : isTa
                              ? "முகவரி உள்ளிடுக"
                              : "Enter Address"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-80" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

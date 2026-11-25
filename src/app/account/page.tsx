"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User,
  MapPin,
  Clock,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Phone,
  MessageCircle,
  BookOpen,
  ArrowRight,
  Globe,
  Type,
  Sun,
  Save,
  ShieldCheck,
  LogOut,
  LogIn,
  Truck,
  ShoppingBag,
  Heart,
  Loader2,
} from "lucide-react";
import {
  PostalSealIcon,
  ArchivalWaxSealIcon,
} from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { allBooks } from "@/data/books";
import { localized } from "@/lib/i18n";
import {
  SHIPMENT_STATUS_LABELS,
  ST_COURIER_TRACKING_URL,
  normalizeShipmentStatus,
  resolveCourierTrackingUrl,
} from "@/lib/tracking";
import { formatINR } from "@/lib/utils";
import { getGeneralWhatsAppUrl } from "@/lib/whatsapp";

type AccountTab = "wishlist" | "address" | "orders" | "settings";

interface AuthSession {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
    role?: string;
  } | null;
}

function AccountContent() {
  const searchParams = useSearchParams();
  const {
    locale,
    setLocale,
    t,
    fontSize,
    setFontSize,
    readingTheme,
    setReadingTheme,
    shippingRegion,
    setShippingRegion,
    deliveryAddress,
    setDeliveryAddress,
    clearSensitiveStorage,
    wishlist,
    toggleWishlist,
    showToast,
  } = useLanguage();

  const { addToCart } = useCart();
  const isTa = locale === "ta";

  // Tab State with query parameter synchronization
  const tabParam = searchParams.get("tab") as AccountTab | null;
  const validTabs: AccountTab[] = ["wishlist", "address", "orders", "settings"];
  const [activeTab, setActiveTab] = React.useState<AccountTab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : "wishlist"
  );

  const handleTabChange = (newTab: AccountTab) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const [addressForm, setAddressForm] = React.useState(deliveryAddress);
  const [isSavedToast, setIsSavedToast] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // Real Auth Session State
  const [session, setSession] = React.useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  // Cloud Orders State
  const [userOrders, setUserOrders] = React.useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function checkAuthAndLoadOrders() {
      setAuthLoading(true);
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data: AuthSession = await res.json();
          if (isMounted) setSession(data);

          if (data.authenticated) {
            setOrdersLoading(true);
            try {
              const ordersRes = await fetch("/api/orders/my-orders");
              if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                if (isMounted) setUserOrders(ordersData.orders || []);
              }
            } catch (orderErr) {
              console.warn("Failed to load user cloud orders:", orderErr);
            } finally {
              if (isMounted) setOrdersLoading(false);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to check auth status:", err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }
    checkAuthAndLoadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.warn("Logout request error:", e);
    } finally {
      clearSensitiveStorage();
      setSession({ authenticated: false, user: null });
      setUserOrders([]);
      setLoggingOut(false);
      window.location.href = "/login?redirectTo=/account";
    }
  };

  React.useEffect(() => {
    setAddressForm(deliveryAddress);
  }, [deliveryAddress]);

  // Filter saved books
  const savedBooks = React.useMemo(() => {
    return allBooks.filter((book) => wishlist.includes(book.id));
  }, [wishlist]);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryAddress(addressForm);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const user = session?.authenticated && session.user ? session.user : null;
  const isAuthenticated = !!user;

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Top Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          locale={locale}
          items={[
            {
              label: isTa ? "வாசகர் கணக்கு & நூலகம்" : "Reader Profile & Library",
            },
          ]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2">
        {/* User Hero Banner (Seamless Guest & Authenticated Experience) */}
        <div className="rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-[#0A3A29] bg-gradient-to-r from-emerald-950 via-emerald-900 to-neutral-900 text-white relative overflow-hidden mb-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10 backdrop-blur-md shrink-0 shadow-lg flex items-center justify-center">
                <Image
                  src="/icons/favicon.png"
                  alt="மேதகு களஞ்சியம் வாசகர்"
                  width={64}
                  height={64}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {authLoading ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[11px] font-semibold border border-white/20 font-tamil animate-pulse">
                      {isTa ? "சரிபார்க்கிறது..." : "Checking..."}
                    </span>
                  ) : isAuthenticated ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30 font-tamil flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      {isTa ? "சரிபார்க்கப்பட்ட வாசகர்" : "Verified Reader"}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-400/30 font-tamil flex items-center gap-1">
                      <User className="h-3 w-3 text-amber-300" />
                      {isTa ? "விருந்தினர் வாசகர்" : "Guest Reader"}
                    </span>
                  )}

                  <span className="text-xs text-white/70 font-mono">
                    {user
                      ? `ID: MK-${user.id.slice(0, 6).toUpperCase()}`
                      : `ID: MK-${(wishlist.length * 7 + 101).toString().padStart(4, "0")} (${isTa ? "உள்ளூர்" : "Local"})`}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold font-tamil leading-tight tracking-tight text-white">
                  {user
                    ? user.fullName || (isTa ? "வாசகர் ஆவணக் களஞ்சியம்" : "Reader Library & Account")
                    : isTa
                      ? "வாசகர் ஆவணக் களஞ்சியம்"
                      : "Reader Library & Account"}
                </h1>

                <p className="text-xs sm:text-sm text-emerald-100/85 font-tamil max-w-xl leading-relaxed">
                  {user
                    ? user.email
                      ? `${user.email} — ${isTa ? "உங்கள் விருப்பப் பட்டியல், அஞ்சல் முகவரி, மற்றும் கிளவுட் ஆர்டர்கள் இணைக்கப்பட்டுள்ளன." : "Your saved books, postal address, and cloud orders are synchronized."}`
                      : isTa
                        ? "உங்கள் விருப்பப் பட்டியல், அஞ்சல் முகவரி, மற்றும் ஆர்டர்களை ஒரே இடத்தில் நிர்வகியுங்கள்."
                        : "Manage your saved books, postal delivery address, and cloud orders in one place."
                    : isTa
                      ? "உங்கள் விருப்பப் பட்டியல் மற்றும் அஞ்சல் முகவரி உங்கள் சாதனத்தில் பாதுகாப்பாக உள்ளன. கிளவுட் ஆர்டர்களைக் காண எப்போது வேண்டுமானாலும் உள்நுழையலாம்."
                      : "Your saved books and postal delivery address are stored locally on this device. Sign in anytime to sync your cloud orders."}
                </p>
              </div>
            </div>

            {/* Quick Actions (Adapts to Guest vs Authenticated User) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!isAuthenticated && !authLoading && (
                <Link
                  href="/login?redirectTo=/account"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md transition-all active:scale-95 min-h-[44px]"
                  title={isTa ? "கணக்கில் உள்நுழைக" : "Sign In to Account"}
                >
                  <LogIn className="h-4 w-4 text-neutral-950" />
                  <span className="font-tamil">
                    {isTa ? "உள்நுழைக / பதிவு செய்க" : "Sign In / Register"}
                  </span>
                </Link>
              )}

              <Link
                href="/books"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-bold shadow-md transition-all active:scale-95 min-h-[44px]"
                title={isTa ? "நூல்களை உலாவுக" : "Browse Books"}
              >
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span className="font-tamil">
                  {isTa ? "நூல்களை உலாவுக" : "Browse Books"}
                </span>
              </Link>

              <a
                href={getGeneralWhatsAppUrl("வணக்கம் மேதகு களஞ்சியம், எனது வாசகர் கணக்கு மற்றும் நூல்கள் சம்பந்தமாக தொடர்பு கொள்கிறேன்.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#0A6847] text-white text-xs font-bold shadow-md transition-all active:scale-95 min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-tamil">
                  {isTa ? "உதவி: 63846 54946" : "Help on WhatsApp"}
                </span>
              </a>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/40 text-xs font-bold shadow-md transition-all active:scale-95 min-h-[44px] cursor-pointer disabled:opacity-50"
                  title={isTa ? "கணக்கிலிருந்து வெளியேறு" : "Sign Out of Account"}
                >
                  <LogOut className="h-4 w-4 text-red-300" />
                  <span className="font-tamil">
                    {loggingOut
                      ? (isTa ? "வெளியேறுகிறது..." : "Signing Out...")
                      : (isTa ? "வெளியேறு (Logout)" : "Sign Out")}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Apple HIG Segmented Tab Navigation */}
        <div
          className="p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] flex items-center gap-1 mb-8 overflow-x-auto scrollbar-none shadow-2xs"
          role="tablist"
        >
          {[
            {
              id: "wishlist" as const,
              label: isTa ? "விருப்பப் பட்டியல்" : "Saved Books",
              count: wishlist.length,
              icon: Heart,
            },
            {
              id: "address" as const,
              label: isTa ? "அஞ்சல் முகவரி" : "Delivery Address",
              badge: deliveryAddress.fullName ? (isTa ? "சேமிக்கப்பட்டது" : "Saved") : null,
              icon: MapPin,
            },
            {
              id: "orders" as const,
              label: isTa ? "அஞ்சல் & வழிகாட்டல்" : "Shipping & Orders",
              count: userOrders.length > 0 ? userOrders.length : null,
              icon: PostalSealIcon,
            },
            {
              id: "settings" as const,
              label: isTa ? "தள அமைப்புகள்" : "Display Settings",
              icon: Sliders,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl font-tamil text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer active:scale-[0.98] ${isActive
                  ? "bg-[#0A6847] dark:bg-[#0D5C3A] text-white shadow-xs font-bold"
                  : "text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                  }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive
                    ? "text-white"
                    : tab.id === "wishlist" && wishlist.length > 0
                      ? "text-rose-600 fill-rose-600"
                      : "text-[#0A6847] dark:text-emerald-400"
                    }`}
                />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${isActive
                      ? "bg-black/25 text-white"
                      : "bg-black/8 dark:bg-white/10 text-[#444444] dark:text-zinc-200"
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-normal">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================
            TAB 1: SAVED WISHLIST / LIBRARY
            ======================================================== */}
        {activeTab === "wishlist" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-tamil text-[#111111] dark:text-zinc-100">
                  {isTa ? "நீங்கள் சேமித்த வரலாற்று நூல்கள்" : "Your Saved Literature"}
                </h2>
                <p className="text-xs sm:text-sm text-[#666666] dark:text-zinc-400 font-tamil">
                  {isTa
                    ? "விருப்பப் பட்டியலில் உள்ள புத்தகங்களை ஒரே கிளிக்கில் கூடையில் சேர்த்து இணையதளத்தில் நேரடியாக வாங்கலாம்."
                    : "Add your saved books directly to your cart and purchase online securely on our website."}
                </p>
              </div>

              {savedBooks.length > 0 && (
                <Link
                  href="/books"
                  className="text-xs font-bold text-[#0A6847] dark:text-emerald-400 hover:underline flex items-center gap-1 font-tamil min-h-[44px]"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>{isTa ? "கூடுதல் நூல்களைக் காண்க" : "Browse more books"}</span>
                </Link>
              )}
            </div>

            {savedBooks.length === 0 ? (
              <GlassPanel className="p-12 text-center rounded-3xl border border-dashed border-black/15 dark:border-white/15 space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
                  <Heart className="h-8 w-8 text-rose-600 fill-rose-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold font-tamil text-[#111111] dark:text-zinc-100">
                    {isTa ? "உங்கள் விருப்பப் பட்டியல் காலியாக உள்ளது" : "Your Wishlist is Empty"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#666666] dark:text-zinc-400 font-tamil max-w-md mx-auto">
                    {isTa
                      ? "நூல்கள் பக்கத்தில் எந்த நூலின் மீதும் உள்ள இதயக் குறியை (Heart) அழுத்தி உங்கள் விருப்பப் பட்டியலில் சேமிக்கலாம்."
                      : "Click the heart icon on any book across the catalog to save it to your wishlist for instant on-site ordering."}
                  </p>
                </div>
                <div className="pt-2">
                  <Button href="/books" variant="primary" size="md" className="font-tamil min-h-[44px]">
                    <BookOpen className="h-4 w-4" />
                    <span>{isTa ? "நூல்களின் பட்டியலுக்குச் செல்க" : "Explore Book Catalog"}</span>
                  </Button>
                </div>
              </GlassPanel>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBooks.map((book) => {
                  return (
                    <article
                      key={book.id}
                      className="glass-panel rounded-2xl p-4 border border-black/10 dark:border-white/10 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/books/${book.slug}`}
                          className="relative w-20 aspect-[3/4] rounded-lg overflow-hidden shrink-0 shadow-md bg-stone-100 dark:bg-zinc-800"
                        >
                          <Image
                            src={book.image || "/images/books/book-placeholder.webp"}
                            alt={isTa ? book.title : book.titleEn}
                            fill
                            sizes="80px"
                            className="object-cover"
                            loading="lazy"
                          />
                        </Link>
                        <div className="flex-1 min-w-0 space-y-1">
                          <Badge variant="category" className="text-[10px]">
                            {isTa ? book.categoryTa : book.categoryEn}
                          </Badge>
                          <Link href={`/books/${book.slug}`}>
                            <h3 className="text-sm font-bold font-tamil text-[#111111] dark:text-zinc-100 hover:text-[#0A6847] dark:hover:text-emerald-400 line-clamp-2 transition-colors">
                              {isTa ? book.title : book.titleEn}
                            </h3>
                          </Link>
                          <p className="text-xs text-[#666666] dark:text-zinc-400 font-tamil truncate">
                            {isTa ? book.author : book.authorEn}
                          </p>
                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-sm sm:text-base font-bold text-[#111111] dark:text-zinc-100">
                              {formatINR(book.discountPrice ?? book.price)}
                            </span>
                            {book.discountPrice && (
                              <span className="text-xs text-stone-400 dark:text-zinc-500 line-through">
                                {formatINR(book.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-black/8 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => {
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
                            showToast({
                              type: "cart",
                              titleTa: "கூடையில் சேர்க்கப்பட்டது",
                              titleEn: "Added to Cart",
                              messageTa: `"${book.title}" உங்கள் கூடையில் சேர்க்கப்பட்டது.`,
                              messageEn: `"${book.titleEn}" added to your cart.`,
                              actionLabelTa: "கூடை காண்க",
                              actionLabelEn: "View Cart",
                              actionHref: "/cart",
                            });
                          }}
                          className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs font-tamil active:scale-95 cursor-pointer"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          <span>{isTa ? "கூடையில் சேர்" : "Add to Cart"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleWishlist(book.id)}
                          aria-label={isTa ? "விருப்பப்பட்டியலிலிருந்து நீக்கு" : "Remove from wishlist"}
                          className="min-h-[44px] min-w-[44px] rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center transition-all cursor-pointer"
                          title={isTa ? "விருப்பப்பட்டியலிலிருந்து நீக்கு" : "Remove from Wishlist"}
                        >
                          <Heart className="h-4 w-4 fill-rose-600 text-rose-600" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: SAVED DELIVERY ADDRESS
            ======================================================== */}
        {activeTab === "address" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <GlassPanel className="p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-white/10 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-tamil text-[#111111] dark:text-zinc-100">
                      {isTa ? "அஞ்சல் டெலிவரி முகவரி" : "Postal Delivery Address"}
                    </h2>
                    <p className="text-xs text-[#666666] dark:text-zinc-400 font-tamil">
                      {isTa
                        ? "முகவரியை ஒருமுறை சேமித்தால் போதும்; இணையதள ஆர்டரின் போது தானாகவே இணைக்கப்படும்."
                        : "Save your address once to auto-populate it into your on-site checkout orders."}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 dark:bg-emerald-500/20 flex items-center justify-center text-[#0A6847] dark:text-emerald-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="addr-fullName" className="text-xs font-bold text-[#333333] dark:text-zinc-200 font-tamil block">
                        {isTa ? "பெறுநர் பெயர் (Full Name) *" : "Full Name *"}
                      </label>
                      <input
                        id="addr-fullName"
                        type="text"
                        required
                        value={addressForm.fullName}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, fullName: e.target.value })
                        }
                        placeholder={isTa ? "எ.கா: சுந்தரம் அல்லது அறிவழகன்" : "e.g. Arivalagan M"}
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white dark:bg-zinc-900 text-base sm:text-sm text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="addr-phone" className="text-xs font-bold text-[#333333] dark:text-zinc-200 font-tamil block">
                        {isTa ? "தொடர்பு அலைபேசி எண் (Contact Phone Number) *" : "Phone Number *"}
                      </label>
                      <input
                        id="addr-phone"
                        type="tel"
                        required
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, phone: e.target.value })
                        }
                        placeholder={isTa ? "+91 98765 43210" : "+91 98765 43210"}
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white dark:bg-zinc-900 text-base sm:text-sm text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="addr-doorStreet" className="text-xs font-bold text-[#333333] dark:text-zinc-200 font-tamil block">
                      {isTa ? "கதவு எண் / தெருப் பெயர் (Door No, Street & Area) *" : "Street Address *"}
                    </label>
                    <input
                      id="addr-doorStreet"
                      type="text"
                      required
                      value={addressForm.doorStreet}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, doorStreet: e.target.value })
                      }
                      placeholder={isTa ? "எ.கா: கதவு எண் 12, வடக்குத் தெரு" : "Door No 12, North Street"}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white dark:bg-zinc-900 text-base sm:text-sm text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="addr-cityArea" className="text-xs font-bold text-[#333333] dark:text-zinc-200 font-tamil block">
                        {isTa ? "ஊர் / நகரம் (City / Town) *" : "City / Town *"}
                      </label>
                      <input
                        id="addr-cityArea"
                        type="text"
                        required
                        value={addressForm.cityArea}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, cityArea: e.target.value })
                        }
                        placeholder={isTa ? "எ.கா: திருநெல்வேலி / சென்னை" : "Chennai"}
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white dark:bg-zinc-900 text-base sm:text-sm text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="addr-districtState" className="text-xs font-bold text-[#333333] dark:text-zinc-200 font-tamil block">
                        {isTa ? "மாநிலம் (State) *" : "State *"}
                      </label>
                      <select
                        id="addr-districtState"
                        value={addressForm.districtState}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, districtState: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white dark:bg-zinc-900 text-base sm:text-sm text-[#111111] dark:text-zinc-100 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                      >
                        <option value="தமிழ்நாடு (Tamil Nadu)">தமிழ்நாடு (Tamil Nadu)</option>
                        <option value="புதுச்சேரி (Puducherry)">புதுச்சேரி (Puducherry)</option>
                        <option value="கர்நாடகா (Karnataka)">கர்நாடகா (Karnataka)</option>
                        <option value="கேரளா (Kerala)">கேரளா (Kerala)</option>
                        <option value="ஆந்திரா / தெலங்கானா (Andhra / Telangana)">ஆந்திரா / தெலங்கானா</option>
                        <option value="மகாராஷ்டிரா (Maharashtra)">மகாராஷ்டிரா (Maharashtra)</option>
                        <option value="பிற இந்திய மாநிலங்கள் (Other Indian States)">பிற இந்திய மாநிலங்கள்</option>
                        <option value="வெளிநாடு (Overseas Diaspora)">வெளிநாடு (Overseas Diaspora)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="addr-pincode" className="text-xs font-bold text-[#333333] dark:text-zinc-200 font-tamil block">
                        {isTa ? "அஞ்சல் குறியீடு (Pincode) *" : "Pincode *"}
                      </label>
                      <input
                        id="addr-pincode"
                        type="text"
                        required
                        value={addressForm.pincode}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, pincode: e.target.value })
                        }
                        placeholder="627201"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white dark:bg-zinc-900 text-base sm:text-sm text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="min-h-[44px] px-6 font-tamil"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isTa ? "முகவரியைச் சேமிக்க" : "Save Address"}</span>
                    </Button>

                    {isSavedToast && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold font-tamil animate-fade-in">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{isTa ? "முகவரி பாதுகாப்பாகச் சேமிக்கப்பட்டது!" : "Address saved successfully!"}</span>
                      </span>
                    )}
                  </div>
                </form>
              </GlassPanel>
            </div>

            {/* Right: Postal Dispatch Label Preview & Overseas Info */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-panel p-6 rounded-3xl border border-emerald-900/15 dark:border-emerald-700/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs font-tamil">
                  <PostalSealIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isTa ? "அஞ்சல் பார்சல் முகவரி மாதிரி" : "Postal Delivery Label"}</span>
                </div>
                <h3 className="text-sm font-bold text-[#111111] dark:text-zinc-100 font-tamil">
                  {isTa
                    ? "இணையதள ஆர்டர் செய்யப்படும்போது பார்சலில் அச்சிடப்படும் வடிவம்:"
                    : "How this appears on your delivery parcel:"}
                </h3>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-black/10 dark:border-white/10 text-xs font-mono text-[#222222] dark:text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {`பெறுநர் (To):\n${addressForm.fullName || "பெயர் குறிப்பிடப்படவில்லை"
                    }\n${addressForm.phone ? `அலைபேசி: ${addressForm.phone}\n` : ""}${addressForm.doorStreet || "கதவு எண் / தெரு முகவரி"
                    }\n${addressForm.cityArea || "நகரம் / ஊர்"} - ${addressForm.districtState || "மாவட்டம் / மாநிலம்"
                    }\nஅஞ்சல் குறியீடு: ${addressForm.pincode || "Pincode"}\nநாடு: இந்தியா (India)`}
                </div>
                <p className="text-[11px] text-[#555555] dark:text-zinc-400 font-tamil">
                  {isTa
                    ? "✓ இணையதள செக்அவுட்டின் போது ST Courier / Speed Post பார்சலில் இந்த முகவரியே நேரடியாக இணைக்கப்படும்."
                    : "✓ Automatically printed on your courier parcel during on-site checkout."}
                </p>
              </div>

              {/* Overseas / International Diaspora Note */}
              <div className="glass-panel p-5 rounded-2xl border border-amber-900/20 dark:border-amber-700/30 bg-amber-50/60 dark:bg-amber-950/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 font-tamil flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                  <span>{isTa ? "வெளிநாட்டு வாசகர்கள் (Overseas Orders)" : "Overseas Diaspora Orders"}</span>
                </h4>
                <p className="text-xs text-amber-900 dark:text-amber-300 font-tamil leading-relaxed">
                  {isTa
                    ? "இந்தியாவிற்கு வெளியே வசிக்கும் வாசகர்கள் (Diaspora / International), வெளிநாட்டு தபால் கட்டணம் மற்றும் பார்சல் எடையை உறுதிப்படுத்த வாட்ஸ்அப் (WhatsApp) மூலம் தொடர்பு கொள்ளலாம்."
                    : "Readers outside India (Diaspora / International) can contact our desk on WhatsApp for custom international courier rates based on parcel weight and country."}
                </p>
                <div className="pt-1">
                  <a
                    href={getGeneralWhatsAppUrl("வணக்கம் மேதகு களஞ்சியம், நான் வெளிநாட்டிலிருந்து (Overseas Order) நூல்களை வாங்க தொடர்பு கொள்கிறேன்.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-200 hover:underline font-tamil"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{isTa ? "வெளிநாட்டு ஆர்டர் உதவி பெற" : "Contact for Overseas Order"}</span>
                  </a>
                </div>
              </div>

              {/* Courier Rate Card */}
              <div className="glass-panel p-5 rounded-2xl border border-black/10 dark:border-white/10 space-y-2.5">
                <h4 className="text-xs font-bold text-[#111111] dark:text-zinc-100 font-tamil flex items-center gap-1.5">
                  <PostalSealIcon className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
                  <span>{isTa ? "அஞ்சல் கட்டண விவரங்கள்" : "Shipping Policy"}</span>
                </h4>
                <ul className="text-xs text-[#555555] dark:text-zinc-400 font-tamil space-y-1.5">
                  <li className="flex items-center justify-between">
                    <span>{isTa ? "தமிழ்நாடு (ST Courier / Speed Post)" : "Tamil Nadu"}</span>
                    <span className="font-bold text-[#111111] dark:text-zinc-100">₹60</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{isTa ? "பிற இந்திய மாநிலங்கள் (Speed Post)" : "Other Indian States"}</span>
                    <span className="font-bold text-[#111111] dark:text-zinc-100">₹100</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{isTa ? "வெளிநாட்டுப் பார்சல் (DHL / Post)" : "International Diaspora"}</span>
                    <span className="font-bold text-[#111111] dark:text-zinc-100">{isTa ? "எடைக்கேற்ப" : "By Weight"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: ORDERS & SHIPPING STATUS (Accessible & Comprehensive)
            ======================================================== */}
        {activeTab === "orders" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              {/* Authenticated User: Online Orders from Supabase */}
              {isAuthenticated && userOrders.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold font-tamil text-[#111111] dark:text-zinc-100 flex items-center justify-between">
                    <span>{isTa ? "உங்கள் ஆன்லைன் ஆர்டர்கள்" : "Your Online Orders"}</span>
                    <span className="text-xs text-[#0A6847] dark:text-emerald-400 font-mono">({userOrders.length})</span>
                  </h2>

                  <div className="space-y-3">
                    {userOrders.map((o: any) => {
                      const courierName = o.courier_name || o.courier || "ST Courier";
                      const trackingId = o.tracking_id || o.tracking_number;
                      const shipStatus = normalizeShipmentStatus(o.shipment_status, o.status, trackingId);
                      const shipStatusLabel = SHIPMENT_STATUS_LABELS[shipStatus][locale];
                      const trackUrl =
                        o.tracking_url || resolveCourierTrackingUrl(courierName) || ST_COURIER_TRACKING_URL;
                      const customerNote = localized(o, "customer_note", locale);

                      return (
                        <GlassPanel key={o.id} className="p-5 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-zinc-100 block">
                                {o.order_number}
                              </span>
                              <span className="text-[11px] text-neutral-500 dark:text-zinc-400 font-mono">
                                {new Date(o.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-xs font-bold font-mono text-[#0A6847] dark:text-emerald-400 block">
                                {formatINR(o.total_amount)}
                              </span>
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-tamil">
                                {shipStatusLabel}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-neutral-600 dark:text-zinc-300 font-tamil border-t border-black/5 dark:border-white/5 pt-2">
                            <p className="line-clamp-1">
                              {o.order_items?.map((item: any) => `${item.title} (x${item.quantity})`).join(", ")}
                            </p>
                            {customerNote && (
                              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                {customerNote}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-xs">
                            {trackingId ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] text-neutral-700 dark:text-zinc-200 font-mono flex items-center gap-1">
                                  <Truck className="h-3.5 w-3.5 text-[#0A6847] dark:text-emerald-400" />
                                  <span>{courierName}: {trackingId}</span>
                                </span>
                                <a
                                  href={trackUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-[#0A6847] dark:text-emerald-300 hover:underline"
                                >
                                  <span>{isTa ? "கண்காணிக்க" : "Track"}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-tamil flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                <span>{shipStatusLabel}</span>
                              </span>
                            )}

                            <Link
                              href={`/orders/${o.order_number}`}
                              className="font-bold text-[#0A6847] dark:text-emerald-400 hover:underline flex items-center gap-1 font-tamil"
                            >
                              <span>{isTa ? "ரசீது & விபரம்" : "View Receipt & Timeline"}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </GlassPanel>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Authenticated User: Empty Orders State */}
              {isAuthenticated && userOrders.length === 0 && !ordersLoading && (
                <GlassPanel className="p-8 text-center rounded-3xl border border-dashed border-black/15 dark:border-white/15 space-y-3">
                  <div className="h-12 w-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0A6847] dark:text-emerald-400 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold font-tamil text-[#111111] dark:text-zinc-100">
                    {isTa ? "இதுவரை ஆன்லைன் ஆர்டர்கள் எதுவும் செய்யப்படவில்லை" : "No orders found for this account"}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-zinc-400 font-tamil max-w-sm mx-auto">
                    {isTa
                      ? "நீங்கள் வாங்கும் வரலாற்று நூல்களின் பார்சல் நிலை மற்றும் ரசீதுகள் இங்கே உடனடியாகக் காட்டப்படும்."
                      : "Your future book purchases, dispatch AWB numbers, and tax invoices will appear here."}
                  </p>
                  <div className="pt-1">
                    <Button href="/books" variant="primary" size="sm" className="font-tamil min-h-[44px]">
                      <BookOpen className="h-4 w-4" />
                      <span>{isTa ? "நூல்களை உலாவுக" : "Browse Catalog"}</span>
                    </Button>
                  </div>
                </GlassPanel>
              )}

              {/* Orders Loading State */}
              {ordersLoading && (
                <div className="p-8 rounded-3xl border border-black/10 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-tamil text-[#666666] dark:text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0A6847] dark:text-emerald-400" />
                  <span>{isTa ? "ஆர்டர் விவரங்கள் பதிவேற்றப்படுகின்றன..." : "Loading order history..."}</span>
                </div>
              )}

              {/* Guest Reader: Sign In Prompt for Orders */}
              {!isAuthenticated && !authLoading && (
                <GlassPanel className="p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-black/5 to-white/40 dark:from-emerald-950/40 dark:to-neutral-900 shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#0A6847] text-white flex items-center justify-center shrink-0 shadow-md">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="text-base font-bold font-tamil text-[#111111] dark:text-zinc-100">
                        {isTa ? "உங்கள் ஆன்லைன் ஆர்டர்களைக் காண உள்நுழையவும்" : "Sign in to track your orders"}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#555555] dark:text-zinc-300 font-tamil leading-relaxed">
                        {isTa
                          ? "நீங்கள் ஏற்கனவே தளத்தில் பதிவு செய்த மின்னஞ்சல் மூலம் உள்நுழைந்து, உங்களது பார்சல் கண்காணிப்பு (AWB Tracking) மற்றும் பில் ரசீதுகளைக் காணலாம்."
                          : "Sign in with your registered account email to view past orders, live AWB postal tracking, and tax invoices."}
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <Button
                          href="/login?redirectTo=/account%3Ftab%3Dorders"
                          variant="primary"
                          size="md"
                          className="font-tamil min-h-[44px]"
                        >
                          <LogIn className="h-4 w-4" />
                          <span>{isTa ? "கணக்கில் உள்நுழைக" : "Sign In to Account"}</span>
                        </Button>
                        <Link
                          href="/signup?redirectTo=/account%3Ftab%3Dorders"
                          className="text-xs font-bold text-[#0A6847] dark:text-emerald-400 hover:underline font-tamil min-h-[44px] inline-flex items-center"
                        >
                          {isTa ? "புதிய வாசகர் கணக்கு தொடங்குக →" : "Create new account →"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              )}

              {/* Purchasing & Dispatch Protocol Guide (Accessible to All) */}
              <GlassPanel className="p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 dark:bg-emerald-500/20 flex items-center justify-center text-[#0A6847] dark:text-emerald-400">
                      <PostalSealIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-tamil text-[#111111] dark:text-zinc-100">
                        {isTa ? "இணையதள நேரடி கொள்முதல் மற்றும் அஞ்சல் கொள்கை" : "On-Site Purchasing & Postal Dispatch Protocol"}
                      </h2>
                      <p className="text-xs text-[#666666] dark:text-zinc-400 font-tamil">
                        {isTa
                          ? "நமது தளத்தில் அனைத்து உள்நாட்டு ஆர்டர்களும் இணையதளக் கூடை வழியாக மட்டுமே பாதுகாப்பாக ஏற்றுக்கொள்ளப்படுகின்றன."
                          : "All domestic orders are fulfilled directly through our secure on-site checkout."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      {
                        step: "1",
                        title: isTa ? "நூலைத் தேர்ந்தெடுத்து கூடையில் சேர்த்தல்" : "Select Books & Add to Cart",
                        desc: isTa
                          ? "எந்த ஒரு வரலாற்று நூலையும் 'கூடையில் சேர்' அல்லது 'இப்போதே வாங்குக' மூலம் இணையதளத்தில் தேர்வு செய்யலாம்."
                          : "Choose any historical book across the catalog and add it directly to your on-site cart.",
                      },
                      {
                        step: "2",
                        title: isTa ? "பாதுகாப்பான இணையதள கட்டணம் (UPI / Card)" : "Secure On-Site Payment",
                        desc: isTa
                          ? "Google Pay, PhonePe, Paytm, கார்டுகள் அல்லது நெட் பேங்கிங் மூலம் இணையதளத்திலேயே பாதுகாப்பாக கட்டணம் செலுத்தலாம்."
                          : "Pay instantly on our website using UPI, Google Pay, PhonePe, Debit/Credit Cards, or Net Banking.",
                      },
                      {
                        step: "3",
                        title: isTa ? "நேரடி அஞ்சல் கண்காணிப்பு (AWB Tracking)" : "Postal Dispatch & Live Tracking",
                        desc: isTa
                          ? "ஆர்டர் செய்யப்பட்டதும் அதே நாளில் பார்சல் அனுப்பப்பட்டு ST Courier அல்லது India Post கண்காணிப்பு எண் வழங்கப்படும்."
                          : "Same-day postal dispatch with live ST Courier or India Post AWB tracking.",
                      },
                    ].map((st) => (
                      <div
                        key={st.step}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-black/5 dark:border-white/10"
                      >
                        <div className="h-7 w-7 rounded-full bg-[#0A6847] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {st.step}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold font-tamil text-[#111111] dark:text-zinc-100">{st.title}</h4>
                          <p className="text-xs text-[#666666] dark:text-zinc-400 font-tamil">{st.desc}</p>
                        </div>
                      </div>
                    ))}

                    {/* Overseas Diaspora Notice */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 dark:border-amber-700/30 space-y-2 font-tamil">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200">
                        <Globe className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
                        <span>{isTa ? "வெளிநாட்டு வாசகர்கள் கவனத்திற்கு (Overseas Orders)" : "Overseas / International Diaspora Notice"}</span>
                      </div>
                      <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                        {isTa
                          ? "வெளிநாட்டு அஞ்சல் சேவைக்கு (DHL / International Post) மட்டும் வாட்ஸ்அப் வழி தொடர்பு கொண்டு பார்சல் எடை மற்றும் நாட்டின் அஞ்சல் கட்டணங்களை உறுதி செய்து ஆர்டர் செய்யலாம்."
                          : "WhatsApp ordering is reserved exclusively for overseas / international readers to calculate parcel weight and international shipping rates."}
                      </p>
                      <a
                        href={getGeneralWhatsAppUrl("வணக்கம் மேதகு களஞ்சியம், நான் வெளிநாட்டிலிருந்து (Overseas Order) நூல்களை வாங்க தொடர்பு கொள்கிறேன்.")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{isTa ? "வெளிநாட்டு ஆர்டருக்கு WhatsApp-இல் பேசுக" : "Inquire Overseas Order on WhatsApp"}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Direct Hotline Actions */}
              <GlassPanel className="p-6 rounded-3xl border border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-sm font-bold font-tamil text-[#111111] dark:text-zinc-100">
                    {isTa ? "நூல்கள் அல்லது பார்சல் குறித்த விசாரணையா?" : "Need shipment status or inquiries?"}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-zinc-400 font-tamil">
                    {isTa ? "அதிகாரப்பூர்வ உதவி எண்: +91 63846 54946 (காலை 9 முதல் இரவு 9 வரை)" : "Support hotline: +91 63846 54946 (9 AM - 9 PM IST)"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="tel:+916384654946"
                    className="min-h-[44px] px-4 rounded-xl border border-black/12 dark:border-white/15 bg-white dark:bg-zinc-800 hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-[#111111] dark:text-zinc-100 flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
                    <span>{isTa ? "அழைக்க" : "Call"}</span>
                  </a>
                  <a
                    href={getGeneralWhatsAppUrl("வணக்கம் மேதகு களஞ்சியம், எனது பார்சல் நிலை குறித்து அறிய விரும்புகிறேன்.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </GlassPanel>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {/* Trust & Verification Card */}
              <GlassPanel className="p-6 rounded-3xl border border-black/10 dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0A6847] dark:text-emerald-400 font-tamil">
                  <ArchivalWaxSealIcon className="h-4 w-4" />
                  <span>{isTa ? "பதிவு செய்யப்பட்ட நிறுவனம்" : "Registered Enterprise"}</span>
                </div>
                <div className="space-y-2 text-xs font-tamil text-[#444444] dark:text-zinc-300 leading-relaxed">
                  <p>
                    <strong className="text-[#111111] dark:text-zinc-100">{isTa ? "நிறுவனப் பெயர்:" : "Entity:"}</strong> மேதகு களஞ்சியம் (Methagu Kalanjiyam)
                  </p>
                  <p>
                    <strong className="text-[#111111] dark:text-zinc-100">{isTa ? "அரசு MSME பதிவு எண்:" : "UDYAM Registration:"}</strong> UDYAM-TN-18-0101323
                  </p>
                  <p>
                    <strong className="text-[#111111] dark:text-zinc-100">{isTa ? "முகவரி:" : "Address:"}</strong> தெற்குத் தெரு, கானார்பட்டி, திருநெல்வேலி, தமிழ்நாடு - 627201
                  </p>
                </div>
                <div className="pt-2 border-t border-black/8 dark:border-white/10">
                  <Link
                    href="/certificate"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] dark:text-emerald-400 hover:underline font-tamil min-h-[44px]"
                  >
                    <span>{isTa ? "மத்திய அரசு சான்றிதழைப் பார்வையிடுக" : "View Official MSME Certificate"}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: PLATFORM & READING SETTINGS
            ======================================================== */}
        {activeTab === "settings" && (
          <div className="max-w-2xl">
            <GlassPanel className="p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-white/10 shadow-md space-y-8">
              <div className="pb-4 border-b border-black/10 dark:border-white/10">
                <h2 className="text-lg sm:text-xl font-bold font-tamil text-[#111111] dark:text-zinc-100">
                  {t("settingsTitle")}
                </h2>
                <p className="text-xs text-[#666666] dark:text-zinc-400 font-tamil">
                  {isTa ? "உங்கள் வசதிக்கேற்ப எழுத்து அளவு மற்றும் வாசிப்பு முறையைத் தேர்ந்தெடுக்கவும்." : "Customize language, text sizing, and color themes."}
                </p>
              </div>

              {/* 1. Language Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
                  <span>{t("languageLabel")}</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: "ta" as const, label: "தமிழ் (Tamil)", sub: "முதன்மை மொழி" },
                    { code: "en" as const, label: "English", sub: "International" },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLocale(item.code)}
                      className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all cursor-pointer ${locale === item.code
                        ? "border-[#0A6847] dark:border-emerald-500 bg-[#0A6847]/10 dark:bg-emerald-500/20 ring-2 ring-[#0A6847]/30 text-[#0A6847] dark:text-emerald-300 font-bold"
                        : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-800/80 hover:bg-black/5 dark:hover:bg-white/10 text-[#333333] dark:text-zinc-200"
                        }`}
                    >
                      <div className="font-bold text-xs sm:text-sm font-tamil">{item.label}</div>
                      <div className="text-[11px] opacity-70 font-tamil">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Font Size Scaling */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil flex items-center gap-1.5">
                  <Type className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
                  <span>{t("fontSizeLabel")}</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "normal" as const, label: t("fontNormal"), size: "16px" },
                    { id: "large" as const, label: t("fontLarge"), size: "18px" },
                    { id: "extra-large" as const, label: t("fontExtraLarge"), size: "20px" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFontSize(item.id)}
                      className={`min-h-[48px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${fontSize === item.id
                        ? "border-[#0A6847] dark:border-emerald-500 bg-[#0A6847]/10 dark:bg-emerald-500/20 ring-2 ring-[#0A6847]/30 text-[#0A6847] dark:text-emerald-300 font-bold"
                        : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-800/80 hover:bg-black/5 dark:hover:bg-white/10 text-[#444444] dark:text-zinc-300"
                        }`}
                    >
                      <div className="text-xs font-tamil">{item.label}</div>
                      <div className="text-[10px] text-[#666666] dark:text-zinc-400">{item.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Reading Theme Mode */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
                  <span>{t("themeLabel")}</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "parchment" as const, label: t("themeParchment"), bg: "bg-[#FBF8F3] text-stone-900 border-[#E8DEC8]" },
                    { id: "white" as const, label: t("themeWhite"), bg: "bg-[#FFFFFF] text-stone-900 border-gray-200" },
                    { id: "night" as const, label: t("themeNight"), bg: "bg-[#18181B] text-white border-zinc-700" },
                  ].map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setReadingTheme(th.id)}
                      className={`min-h-[50px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${th.bg} ${readingTheme === th.id
                        ? "ring-2 ring-[#0A6847] dark:ring-emerald-400 shadow-sm font-bold scale-[1.02]"
                        : "opacity-80 hover:opacity-100"
                        }`}
                    >
                      <div className="text-xs font-tamil">{th.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Courier Region */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
                  <span>{t("regionLabel")}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "tamil-nadu" as const, label: t("regionTN") },
                    { id: "other-india" as const, label: t("regionOtherIndia") },
                    { id: "diaspora" as const, label: t("regionDiaspora") },
                  ].map((rg) => (
                    <button
                      key={rg.id}
                      type="button"
                      onClick={() => setShippingRegion(rg.id)}
                      className={`min-h-[48px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${shippingRegion === rg.id
                        ? "border-[#0A6847] dark:border-emerald-500 bg-[#0A6847]/10 dark:bg-emerald-500/20 ring-2 ring-[#0A6847]/30 text-[#0A6847] dark:text-emerald-300 font-bold"
                        : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-800/80 hover:bg-black/5 dark:hover:bg-white/10 text-[#444444] dark:text-zinc-300"
                        }`}
                    >
                      <div className="text-xs font-tamil">{rg.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0A6847] border-t-transparent" />
        </div>
      }
    >
      <AccountContent />
    </React.Suspense>
  );
}

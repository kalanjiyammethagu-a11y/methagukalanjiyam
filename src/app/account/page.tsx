"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  MapPin,
  Clock,
  Sliders,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Phone,
  MessageCircle,
  BookOpen,
  ArrowRight,
  Globe,
  Type,
  Sun,
  MessageSquare,
  Save,
  ShieldCheck,
  LogOut,
  Truck,
} from "lucide-react";
import {
  BookmarkRibbonIcon,
  PostalSealIcon,
  ArchivalWaxSealIcon,
  ArchivalFolioIcon,
} from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLanguage, type FontSize, type ReadingTheme, type ShippingRegion } from "@/context/LanguageContext";
import { allBooks, type BookItem } from "@/data/books";
import { formatINR } from "@/lib/utils";
import { getWhatsAppOrderUrl, getGeneralWhatsAppUrl } from "@/lib/whatsapp";

type AccountTab = "wishlist" | "address" | "orders" | "settings";

export default function AccountPage() {
  const {
    locale,
    setLocale,
    toggleLocale,
    t,
    fontSize,
    setFontSize,
    readingTheme,
    setReadingTheme,
    shippingRegion,
    setShippingRegion,
    deliveryAddress,
    setDeliveryAddress,
    getFormattedAddress,
    clearSensitiveStorage,
    wishlist,
    toggleWishlist,
  } = useLanguage();

  const isTa = locale === "ta";
  const [activeTab, setActiveTab] = React.useState<AccountTab>("wishlist");
  const [addressForm, setAddressForm] = React.useState(deliveryAddress);
  const [isSavedToast, setIsSavedToast] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [userOrders, setUserOrders] = React.useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);

  React.useEffect(() => {
    async function loadOrders() {
      setOrdersLoading(true);
      try {
        const res = await fetch("/api/orders/my-orders");
        if (res.ok) {
          const data = await res.json();
          setUserOrders(data.orders || []);
        }
      } catch (err) {
        console.warn("Failed to load user orders:", err);
      } finally {
        setOrdersLoading(false);
      }
    }
    loadOrders();
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
      window.location.href = "/login";
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
        {/* User Hero Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-black/10 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-neutral-900 text-white relative overflow-hidden mb-8 shadow-xl">
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
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30 font-tamil">
                    {isTa ? "நிரந்தர வாசகர்" : "Verified Reader"}
                  </span>
                  <span className="text-xs text-white/60">
                    ID: MK-{(wishlist.length * 7 + 101).toString().padStart(4, "0")}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-tamil leading-tight tracking-tight text-white">
                  {isTa ? "வாசகர் ஆவணக் களஞ்சியம்" : "Reader Library & Account"}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/80 font-tamil max-w-xl">
                  {isTa
                    ? "உங்கள் விருப்பப் பட்டியல், சேமிக்கப்பட்ட அஞ்சல் முகவரி, மற்றும் தள வாசிப்பு அமைப்புகளை ஒரே இடத்தில் நிர்வகியுங்கள்."
                    : "Manage your saved books, postal delivery address, and reading preferences in one place."}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-tamil">
                  {isTa ? "களஞ்சிய உதவி: 63846 54946" : "Helpdesk on WhatsApp"}
                </span>
              </a>

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
            </div>
          </div>
        </div>

        {/* Apple HIG Segmented Tab Navigation */}
        <div
          className="p-1 rounded-2xl bg-black/[0.04] backdrop-blur-md border border-black/[0.08] flex items-center gap-1 mb-8 overflow-x-auto scrollbar-none shadow-2xs"
          role="tablist"
        >
          {[
            {
              id: "wishlist" as const,
              label: isTa ? "விருப்பப் பட்டியல்" : "Saved Books",
              count: wishlist.length,
              icon: BookmarkRibbonIcon,
            },
            {
              id: "address" as const,
              label: isTa ? "அஞ்சல் முகவரி" : "Delivery Address",
              badge: deliveryAddress.fullName ? (isTa ? "சேமிக்கப்பட்டது" : "Saved") : null,
              icon: MapPin,
            },
            {
              id: "orders" as const,
              label: isTa ? "அஞ்சல் & வழிகாட்டல்" : "Shipping & Hotline",
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
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl font-tamil text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? "bg-[#0A6847] text-white shadow-xs font-bold"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.03]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-[#0A6847]"}`} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-black/8 text-[#555555]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-normal">
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
                <h2 className="text-xl font-bold font-tamil text-[#111111]">
                  {isTa ? "நீங்கள் சேமித்த வரலாற்று நூல்கள்" : "Your Saved Literature"}
                </h2>
                <p className="text-xs sm:text-sm text-[#666666] font-tamil">
                  {isTa
                    ? "விருப்பப் பட்டியலில் உள்ள புத்தகங்களை ஒரே கிளிக்கில் WhatsApp வழியே பெற்றுக் கொள்ளலாம்."
                    : "Easily order your bookmarked books directly via WhatsApp."}
                </p>
              </div>

              {savedBooks.length > 0 && (
                <Link
                  href="/books"
                  className="text-xs font-bold text-[#0A6847] hover:underline flex items-center gap-1 font-tamil min-h-[44px]"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>{isTa ? "கூடுதல் நூல்களைக் காண்க" : "Browse more books"}</span>
                </Link>
              )}
            </div>

            {savedBooks.length === 0 ? (
              <GlassPanel className="p-12 text-center rounded-3xl border border-dashed border-black/15 space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0A6847]">
                  <BookmarkRibbonIcon className="h-8 w-8 text-[#0A6847]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold font-tamil text-[#111111]">
                    {isTa ? "உங்கள் விருப்பப் பட்டியல் காலியாக உள்ளது" : "Your Wishlist is Empty"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#666666] font-tamil max-w-md mx-auto">
                    {isTa
                      ? "நூல்கள் பக்கத்தில் எந்த நூலின் அருகிலும் உள்ள வாசிப்புப் பட்டையை (Bookmark) அழுத்தி இங்கு சேமிக்கலாம்."
                      : "Click the bookmark ribbon on any book across the catalog to save it to your library for instant WhatsApp ordering."}
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
                  const orderUrl = getWhatsAppOrderUrl(
                    book.title,
                    book.discountPrice ?? book.price,
                    book.slug,
                    1,
                    getFormattedAddress()
                  );

                  return (
                    <article
                      key={book.id}
                      className="glass-panel rounded-2xl p-4 border border-black/10 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/books/${book.slug}`}
                          className="relative w-20 aspect-[3/4] rounded-lg overflow-hidden shrink-0 shadow-md bg-stone-100"
                        >
                          <Image
                            src={book.image}
                            alt={isTa ? book.title : book.titleEn}
                            fill
                            className="object-cover"
                          />
                        </Link>
                        <div className="flex-1 min-w-0 space-y-1">
                          <Badge variant="category" className="text-[10px]">
                            {isTa ? book.categoryTa : book.categoryEn}
                          </Badge>
                          <Link href={`/books/${book.slug}`}>
                            <h3 className="text-sm font-bold font-tamil text-[#111111] hover:text-[#0A6847] line-clamp-2 transition-colors">
                              {isTa ? book.title : book.titleEn}
                            </h3>
                          </Link>
                          <p className="text-xs text-[#666666] font-tamil truncate">
                            {isTa ? book.author : book.authorEn}
                          </p>
                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-sm sm:text-base font-bold text-[#111111]">
                              {formatINR(book.discountPrice ?? book.price)}
                            </span>
                            {book.discountPrice && (
                              <span className="text-xs text-stone-400 line-through">
                                {formatINR(book.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-black/8">
                        <a
                          href={orderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs font-tamil active:scale-95"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{isTa ? "WhatsApp ஆர்டர்" : "Order on WhatsApp"}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => toggleWishlist(book.id)}
                          aria-label={isTa ? "பட்டியலிலிருந்து நீக்கு" : "Remove from wishlist"}
                          className="min-h-[44px] min-w-[44px] rounded-xl border border-black/10 hover:border-red-300 hover:bg-red-50 text-[#666666] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                          title={isTa ? "நீக்குக" : "Remove"}
                        >
                          <Trash2 className="h-4 w-4" />
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
              <GlassPanel className="p-6 sm:p-8 rounded-3xl border border-black/10 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-black/10 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-tamil text-[#111111]">
                      {isTa ? "அஞ்சல் டெலிவரி முகவரி" : "Postal Delivery Address"}
                    </h2>
                    <p className="text-xs text-[#666666] font-tamil">
                      {isTa
                        ? "முகவரியை ஒருமுறை சேமித்தால் போதும்; ஆர்டரின் போது கைப்பட தட்டச்சு செய்யத் தேவையில்லை."
                        : "Save your address once to auto-populate it into your direct WhatsApp book orders."}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 flex items-center justify-center text-[#0A6847]">
                    <MapPin className="h-5 w-5" />
                  </div>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="addr-fullName" className="text-xs font-bold text-[#333333] font-tamil block">
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
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="addr-phone" className="text-xs font-bold text-[#333333] font-tamil block">
                        {isTa ? "தொடர்பு அலைபேசி எண் (WhatsApp Phone) *" : "Phone Number *"}
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
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="addr-doorStreet" className="text-xs font-bold text-[#333333] font-tamil block">
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
                      className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="addr-cityArea" className="text-xs font-bold text-[#333333] font-tamil block">
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
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="addr-districtState" className="text-xs font-bold text-[#333333] font-tamil block">
                        {isTa ? "மாநிலம் (State) *" : "State *"}
                      </label>
                      <select
                        id="addr-districtState"
                        value={addressForm.districtState}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, districtState: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm text-[#111111] focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
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
                      <label htmlFor="addr-pincode" className="text-xs font-bold text-[#333333] font-tamil block">
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
                        className="w-full px-4 py-2.5 rounded-xl border border-black/12 bg-white text-sm text-[#111111] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[44px]"
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
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold font-tamil animate-fade-in">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>{isTa ? "முகவரி பாதுகாப்பாகச் சேமிக்கப்பட்டது!" : "Address saved successfully!"}</span>
                      </span>
                    )}
                  </div>
                </form>
              </GlassPanel>
            </div>

            {/* Right: Live Preview of WhatsApp Message */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-panel p-6 rounded-3xl border border-emerald-900/15 bg-emerald-50/50">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs font-tamil mb-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  <span>{isTa ? "நேரடி WhatsApp முன்னோட்டம்" : "Live WhatsApp Integration"}</span>
                </div>
                <h3 className="text-sm font-bold text-[#111111] font-tamil mb-2">
                  {isTa
                    ? "நீங்கள் புத்தகங்களை வாங்கும்போது தானாக அனுப்பப்படும் வடிவம்:"
                    : "How this appears in your WhatsApp order:"}
                </h3>
                <div className="bg-white rounded-2xl p-4 border border-black/10 text-xs font-mono text-[#222222] whitespace-pre-wrap leading-relaxed shadow-inner">
                  {`வணக்கம் மேதகு களஞ்சியம்,\nநான் "[புத்தகத்தின் தலைப்பு]" நூலை வாங்க விரும்புகிறேன்.\n• எண்ணிக்கை: 1\n\n📦 அஞ்சல் டெலிவரி முகவரி:\n${
                    addressForm.fullName || "பெயர் குறிப்பிடப்படவில்லை"
                  }\n${addressForm.phone ? `அலைபேசி: ${addressForm.phone}\n` : ""}${
                    addressForm.doorStreet || "கதவு எண் / தெரு"
                  }\n${addressForm.cityArea || "ஊர்"} - ${
                    addressForm.districtState
                  } - ${addressForm.pincode || "Pincode"}`}
                </div>
                <p className="text-[11px] text-[#555555] font-tamil mt-3">
                  {isTa
                    ? "✓ முகவரி உங்கள் உலாவியில் மட்டுமே பாதுகாப்பாக சேமிக்கப்படும்."
                    : "✓ Saved locally in your browser for privacy and speed."}
                </p>
              </div>

              {/* Courier Rate Card */}
              <div className="glass-panel p-5 rounded-2xl border border-black/10 space-y-2.5">
                <h4 className="text-xs font-bold text-[#111111] font-tamil flex items-center gap-1.5">
                  <PostalSealIcon className="h-4 w-4 text-[#0A6847]" />
                  <span>{isTa ? "அஞ்சல் கட்டண விவரங்கள்" : "Shipping Policy"}</span>
                </h4>
                <ul className="text-xs text-[#555555] font-tamil space-y-1.5">
                  <li className="flex items-center justify-between">
                    <span>{isTa ? "தமிழ்நாடு (ST Courier / Speed Post)" : "Tamil Nadu"}</span>
                    <span className="font-bold text-[#111111]">₹60</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{isTa ? "பிற இந்திய மாநிலங்கள் (Speed Post)" : "Other Indian States"}</span>
                    <span className="font-bold text-[#111111]">₹100</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{isTa ? "வெளிநாட்டுப் பார்சல் (DHL / Post)" : "International Diaspora"}</span>
                    <span className="font-bold text-[#111111]">{isTa ? "எடைக்கேற்ப" : "By Weight"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: ORDERS & SHIPPING STATUS
            ======================================================== */}
        {activeTab === "orders" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              {/* Online Orders from Supabase */}
              {userOrders.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold font-tamil text-[#111111] flex items-center justify-between">
                    <span>{isTa ? "உங்கள் ஆன்லைன் ஆர்டர்கள்" : "Your Online Orders"}</span>
                    <span className="text-xs text-[#0A6847] font-mono">({userOrders.length})</span>
                  </h2>

                  <div className="space-y-3">
                    {userOrders.map((o: any) => (
                      <GlassPanel key={o.id} className="p-5 rounded-2xl border border-black/10 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-xs font-mono font-bold text-neutral-900 block">
                              {o.order_number}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-mono">
                              {new Date(o.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-[#0A6847] block">
                              {formatINR(o.total_amount)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              {o.status}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-neutral-600 font-tamil border-t border-black/5 pt-2">
                          <p className="line-clamp-1">
                            {o.order_items?.map((item: any) => `${item.title} (x${item.quantity})`).join(", ")}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 text-xs">
                          {o.tracking_number ? (
                            <span className="text-[11px] text-neutral-600 font-mono flex items-center gap-1">
                              <Truck className="h-3.5 w-3.5 text-[#0A6847]" />
                              <span>{o.courier || "Post"}: {o.tracking_number}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-tamil flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                              <span>{isTa ? "பார்சல் தயாராகிறது" : "Preparing dispatch"}</span>
                            </span>
                          )}

                          <Link
                            href={`/orders/${o.order_number}`}
                            className="font-bold text-[#0A6847] hover:underline flex items-center gap-1 font-tamil"
                          >
                            <span>{isTa ? "ரசீது காண்க" : "View Receipt"}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </GlassPanel>
                    ))}
                  </div>
                </div>
              )}

              <GlassPanel className="p-6 sm:p-8 rounded-3xl border border-black/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#0A6847]/10 flex items-center justify-center text-[#0A6847]">
                      <PostalSealIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-tamil text-[#111111]">
                        {isTa ? "நேரடி WhatsApp ஆர்டர் வழிகாட்டி" : "WhatsApp Ordering Protocol"}
                      </h2>
                      <p className="text-xs text-[#666666] font-tamil">
                        {isTa
                          ? "நமது நூலகத்தில் அனைத்து ஆர்டர்களும் புலனம் வழியாகவே பாதுகாப்பாக பதிவு செய்யப்படுகின்றன."
                          : "All orders are fulfilled directly via official WhatsApp without intermediary markups."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      {
                        step: "1",
                        title: isTa ? "நூலைத் தேர்ந்தெடுத்தல்" : "Select Your Book",
                        desc: isTa
                          ? "நூலின் பக்கத்தில் உள்ள 'புலனம் வழி வாங்குக' பட்டனை அழுத்தவும்."
                          : "Tap 'Order on WhatsApp' on any book or wishlist item.",
                      },
                      {
                        step: "2",
                        title: isTa ? "பணம் செலுத்தும் விவரம் பெறுதல்" : "Payment Confirmation",
                        desc: isTa
                          ? "களஞ்சியத்தின் அதிகாரப்பூர்வ GPay / PhonePe / Bank விவரங்கள் WhatsApp-இல் பகிரப்படும்."
                          : "Official UPI/Bank transfer details will be shared in WhatsApp chat.",
                      },
                      {
                        step: "3",
                        title: isTa ? "அஞ்சல் கண்காணிப்பு எண் (AWB Tracking)" : "Dispatch & Live Tracking",
                        desc: isTa
                          ? "பணம் செலுத்தியதும் அதே நாளில் பார்சல் அனுப்பப்பட்டு ST Courier அல்லது India Post கண்காணிப்பு எண் வழங்கப்படும்."
                          : "Same-day dispatch with official courier AWB tracking receipt.",
                      },
                    ].map((st) => (
                      <div
                        key={st.step}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/60 border border-black/5"
                      >
                        <div className="h-7 w-7 rounded-full bg-[#0A6847] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {st.step}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold font-tamil text-[#111111]">{st.title}</h4>
                          <p className="text-xs text-[#666666] font-tamil">{st.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassPanel>

              {/* Direct Hotline Actions */}
              <GlassPanel className="p-6 rounded-3xl border border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-sm font-bold font-tamil text-[#111111]">
                    {isTa ? "நூல்கள் அல்லது பார்சல் குறித்த விசாரணையா?" : "Need shipment status or inquiries?"}
                  </h3>
                  <p className="text-xs text-[#666666] font-tamil">
                    {isTa ? "அதிகாரப்பூர்வ உதவி எண்: +91 63846 54946 (காலை 9 முதல் இரவு 9 வரை)" : "Support hotline: +91 63846 54946 (9 AM - 9 PM IST)"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="tel:+916384654946"
                    className="min-h-[44px] px-4 rounded-xl border border-black/12 bg-white hover:bg-black/5 text-xs font-bold text-[#111111] flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-[#0A6847]" />
                    <span>{isTa ? "அழைக்க" : "Call"}</span>
                  </a>
                  <a
                    href={getGeneralWhatsAppUrl("வணக்கம் மேதகு களஞ்சியம், எனது பார்சல் நிலை குறித்து அறிய விரும்புகிறேன்.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </GlassPanel>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {/* Trust & Verification Card */}
              <GlassPanel className="p-6 rounded-3xl border border-black/10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0A6847] font-tamil">
                  <ArchivalWaxSealIcon className="h-4 w-4" />
                  <span>{isTa ? "பதிவு செய்யப்பட்ட நிறுவனம்" : "Registered Enterprise"}</span>
                </div>
                <div className="space-y-2 text-xs font-tamil text-[#444444] leading-relaxed">
                  <p>
                    <strong>{isTa ? "நிறுவனப் பெயர்:" : "Entity:"}</strong> மேதகு களஞ்சியம் (Methagu Kalanjiyam)
                  </p>
                  <p>
                    <strong>{isTa ? "அரசு MSME பதிவு எண்:" : "UDYAM Registration:"}</strong> UDYAM-TN-18-0101323
                  </p>
                  <p>
                    <strong>{isTa ? "முகவரி:" : "Address:"}</strong> தெற்குத் தெரு, கானார்பட்டி, திருநெல்வேலி, தமிழ்நாடு - 627201
                  </p>
                </div>
                <div className="pt-2 border-t border-black/8">
                  <Link
                    href="/certificate"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6847] hover:underline font-tamil min-h-[44px]"
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
            <GlassPanel className="p-6 sm:p-8 rounded-3xl border border-black/10 shadow-md space-y-8">
              <div className="pb-4 border-b border-black/10">
                <h2 className="text-lg sm:text-xl font-bold font-tamil text-[#111111]">
                  {t("settingsTitle")}
                </h2>
                <p className="text-xs text-[#666666] font-tamil">
                  {isTa ? "உங்கள் வசதிக்கேற்ப எழுத்து அளவு மற்றும் வாசிப்பு முறையைத் தேர்ந்தெடுக்கவும்." : "Customize language, text sizing, and color themes."}
                </p>
              </div>

              {/* 1. Language Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-[#0A6847]" />
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
                      className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        locale === item.code
                          ? "border-[#0A6847] bg-[#0A6847]/10 ring-2 ring-[#0A6847]/30 text-[#0A6847]"
                          : "border-black/10 bg-white/70 hover:bg-black/5 text-[#333333]"
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
                <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil flex items-center gap-1.5">
                  <Type className="h-4 w-4 text-[#0A6847]" />
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
                      className={`min-h-[48px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        fontSize === item.id
                          ? "border-[#0A6847] bg-[#0A6847]/10 ring-2 ring-[#0A6847]/30 text-[#0A6847] font-bold"
                          : "border-black/10 bg-white/70 hover:bg-black/5 text-[#444444]"
                      }`}
                    >
                      <div className="text-xs font-tamil">{item.label}</div>
                      <div className="text-[10px] text-[#666666]">{item.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Reading Theme Mode */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-[#0A6847]" />
                  <span>{t("themeLabel")}</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "parchment" as const, label: t("themeParchment"), bg: "bg-[#FBF8F3] border-[#E8DEC8]" },
                    { id: "white" as const, label: t("themeWhite"), bg: "bg-[#FFFFFF] border-gray-200" },
                    { id: "night" as const, label: t("themeNight"), bg: "bg-[#18181B] text-white border-zinc-700" },
                  ].map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setReadingTheme(th.id)}
                      className={`min-h-[50px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${th.bg} ${
                        readingTheme === th.id
                          ? "ring-2 ring-[#0A6847] shadow-sm font-bold scale-[1.02]"
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
                <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#0A6847]" />
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
                      className={`min-h-[48px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        shippingRegion === rg.id
                          ? "border-[#0A6847] bg-[#0A6847]/10 ring-2 ring-[#0A6847]/30 text-[#0A6847] font-bold"
                          : "border-black/10 bg-white/70 hover:bg-black/5 text-[#444444]"
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

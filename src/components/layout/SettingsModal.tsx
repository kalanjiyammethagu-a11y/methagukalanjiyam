"use client";

import * as React from "react";
import { Sliders, Type, Sun, MapPin, Check, Globe } from "lucide-react";
import { useLanguage, type FontSize, type ReadingTheme, type ShippingRegion } from "@/context/LanguageContext";
import { Modal } from "@/components/ui/Modal";

export function SettingsModal() {
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
    isSettingsOpen,
    closeSettings,
  } = useLanguage();

  const isTa = locale === "ta";

  const [addressForm, setAddressForm] = React.useState(deliveryAddress);
  const [addressSaved, setAddressSaved] = React.useState(false);

  React.useEffect(() => {
    setAddressForm(deliveryAddress);
  }, [deliveryAddress]);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryAddress(addressForm);
    setAddressSaved(true);
    setTimeout(() => setAddressSaved(false), 2000);
  };

  return (
    <Modal
      isOpen={isSettingsOpen}
      onClose={closeSettings}
      size="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#0A6847]/10 dark:bg-emerald-500/15 flex items-center justify-center text-[#0A6847] dark:text-emerald-400 shrink-0">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-zinc-100 font-tamil leading-snug">
              {t("settingsTitle")}
            </h2>
            <p className="text-xs text-[#555555] dark:text-zinc-400 font-tamil font-normal">
              {isTa ? "உங்கள் விருப்பத்திற்கேற்ப தளத்தை தனிப்பயனாக்குங்கள்" : "Customize your reading and ordering experience"}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. Language Toggle */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
            <span>{t("languageLabel")}</span>
          </label>
          <div translate="no" className="notranslate grid grid-cols-2 gap-3">
            {[
              { code: "ta" as const, label: "தமிழ் (Tamil)", sub: "முதன்மை மொழி" },
              { code: "en" as const, label: "English", sub: "International" },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLocale(lang.code)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer font-tamil min-h-[44px] ${
                  locale === lang.code
                    ? "bg-[#0A6847] dark:bg-[#0D5C3A] text-white border-[#0A6847] dark:border-emerald-500 shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-[#222222] dark:text-zinc-100 border-black/10 dark:border-white/15 hover:border-[#0A6847]/40 dark:hover:border-emerald-400/50"
                }`}
              >
                <span className="block text-sm font-bold">{lang.label}</span>
                <span className={`text-[11px] block mt-0.5 ${locale === lang.code ? "text-emerald-100" : "text-[#555555] dark:text-zinc-300"}`}>
                  {lang.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Text Size (Accessibility for Senior Readers) */}
        <div className="space-y-2.5 pt-4 border-t border-black/8 dark:border-white/10">
          <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil flex items-center gap-1.5">
            <Type className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
            <span>{t("fontSizeLabel")}</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { size: "normal" as FontSize, label: t("fontNormal"), preview: "16px" },
              { size: "large" as FontSize, label: t("fontLarge"), preview: "18px" },
              { size: "extra-large" as FontSize, label: t("fontExtraLarge"), preview: "20px" },
            ].map((item) => (
              <button
                key={item.size}
                type="button"
                onClick={() => setFontSize(item.size)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-tamil min-h-[44px] ${
                  fontSize === item.size
                    ? "bg-[#0A6847] dark:bg-[#0D5C3A] text-white border-[#0A6847] dark:border-emerald-500 shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-[#222222] dark:text-zinc-100 border-black/10 dark:border-white/15 hover:border-[#0A6847]/40 dark:hover:border-emerald-400/50"
                }`}
              >
                <span className="block text-xs font-bold">{item.label}</span>
                <span className={`text-[10px] block mt-0.5 font-mono ${fontSize === item.size ? "text-emerald-100" : "text-[#555555] dark:text-zinc-300"}`}>
                  {item.preview}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Reading Background Theme */}
        <div className="space-y-2.5 pt-4 border-t border-black/8 dark:border-white/10">
          <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil flex items-center gap-1.5">
            <Sun className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
            <span>{t("themeLabel")}</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { theme: "parchment" as ReadingTheme, label: t("themeParchment"), bg: "bg-[#FAFAF9] text-[#191614]" },
              { theme: "white" as ReadingTheme, label: t("themeWhite"), bg: "bg-white text-[#111827]" },
              { theme: "night" as ReadingTheme, label: t("themeNight"), bg: "bg-neutral-900 text-white" },
            ].map((item) => (
              <button
                key={item.theme}
                type="button"
                onClick={() => setReadingTheme(item.theme)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-tamil min-h-[44px] ${
                  readingTheme === item.theme
                    ? "ring-2 ring-[#0A6847] border-[#0A6847] shadow-sm"
                    : "border-black/10 dark:border-white/15 hover:border-[#0A6847]/40 dark:hover:border-emerald-400/50"
                } ${item.bg}`}
              >
                <span className="block text-xs font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Shipping Region Preference */}
        <div className="space-y-2.5 pt-4 border-t border-black/8 dark:border-white/10">
          <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
            <span>{t("regionLabel")}</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { region: "tamil-nadu" as ShippingRegion, label: t("regionTN") },
              { region: "other-india" as ShippingRegion, label: t("regionOtherIndia") },
              { region: "diaspora" as ShippingRegion, label: t("regionDiaspora") },
            ].map((r) => (
              <button
                key={r.region}
                type="button"
                onClick={() => setShippingRegion(r.region)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer font-tamil min-h-[44px] ${
                  shippingRegion === r.region
                    ? "bg-[#0A6847] dark:bg-[#0D5C3A] text-white border-[#0A6847] dark:border-emerald-500 shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-[#222222] dark:text-zinc-100 border-black/10 dark:border-white/15 hover:border-[#0A6847]/40 dark:hover:border-emerald-400/50"
                }`}
              >
                <span className="block text-xs font-bold leading-snug">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Postal Address for On-Site Checkout */}
        <div className="space-y-3 pt-4 border-t border-black/8 dark:border-white/10">
          <div>
            <label className="text-xs font-bold text-[#333333] dark:text-zinc-200 uppercase tracking-wider block font-tamil">
              {t("savedAddressLabel")}
            </label>
            <p className="text-xs text-[#555555] dark:text-zinc-400 font-tamil mt-0.5">
              {t("savedAddressDesc")}
            </p>
          </div>

          <form onSubmit={handleSaveAddress} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={isTa ? "பெயர் (Full Name)" : "Full Name"}
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                className="px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847] min-h-[44px]"
              />
              <input
                type="tel"
                placeholder={isTa ? "தொலைபேசி எண் (Phone / WA)" : "Phone Number"}
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                className="px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847] min-h-[44px]"
              />
            </div>

            <input
              type="text"
              placeholder={isTa ? "கதவு எண், தெரு முகவரி (Door No, Street Address)" : "Street Address"}
              value={addressForm.doorStreet}
              onChange={(e) => setAddressForm({ ...addressForm, doorStreet: e.target.value })}
              className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847] min-h-[44px]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder={isTa ? "நகரம் / ஊர் (City)" : "City"}
                value={addressForm.cityArea}
                onChange={(e) => setAddressForm({ ...addressForm, cityArea: e.target.value })}
                className="px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847] min-h-[44px]"
              />
              <input
                type="text"
                placeholder={isTa ? "மாவட்டம் / மாநிலம்" : "State"}
                value={addressForm.districtState}
                onChange={(e) => setAddressForm({ ...addressForm, districtState: e.target.value })}
                className="px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847] min-h-[44px]"
              />
              <input
                type="text"
                placeholder={isTa ? "அஞ்சல் குறியீடு (Pincode)" : "Pincode"}
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                className="px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847] min-h-[44px]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {addressSaved ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 font-tamil">
                  <Check className="h-4 w-4" />
                  <span>{t("savedSuccess")}</span>
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold transition-all shadow-xs font-tamil cursor-pointer"
              >
                {t("saveChanges")}
              </button>
            </div>
          </form>
        </div>

        {/* Done / Close Button in body */}
        <div className="pt-4 border-t border-black/8 dark:border-white/10 flex items-center justify-end">
          <button
            type="button"
            onClick={closeSettings}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#0A6847] text-white text-xs font-bold hover:bg-[#085237] transition-colors font-tamil cursor-pointer shadow-xs"
          >
            {isTa ? "முடிந்தது (Done)" : "Done"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

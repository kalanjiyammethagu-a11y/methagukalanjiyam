"use client";

import * as React from "react";
import { X, Sliders, Type, Sun, Moon, MapPin, Check, Globe } from "lucide-react";
import { useLanguage, type FontSize, type ReadingTheme, type ShippingRegion } from "@/context/LanguageContext";

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

  const modalRef = React.useRef<HTMLDivElement>(null);
  const isTa = locale === "ta";

  const [addressForm, setAddressForm] = React.useState(deliveryAddress);
  const [addressSaved, setAddressSaved] = React.useState(false);

  React.useEffect(() => {
    setAddressForm(deliveryAddress);
  }, [deliveryAddress]);

  // Trap focus and handle Escape
  React.useEffect(() => {
    if (isSettingsOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeSettings();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryAddress(addressForm);
    setAddressSaved(true);
    setTimeout(() => setAddressSaved(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isTa ? "தள அமைப்புகள் (Platform Settings)" : "Settings"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={closeSettings}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-xl bg-[#FAFAF9] rounded-3xl border border-black/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-black/10 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#0A6847]/10 flex items-center justify-center text-[#0A6847]">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#111111] font-tamil leading-snug">
                {t("settingsTitle")}
              </h2>
              <p className="text-xs text-[#666666] font-tamil">
                {isTa ? "உங்கள் விருப்பத்திற்கேற்ப தளத்தை தனிப்பயனாக்குங்கள்" : "Customize your reading and ordering experience"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSettings}
            aria-label={isTa ? "மூடுக" : "Close"}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* 1. Language Toggle */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-[#0A6847]" />
              <span>{t("languageLabel")}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: "ta" as const, label: "தமிழ் (Tamil)", sub: "முதன்மை மொழி" },
                { code: "en" as const, label: "English", sub: "International" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLocale(lang.code)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer font-tamil ${
                    locale === lang.code
                      ? "bg-[#0A6847] text-white border-[#0A6847] shadow-sm"
                      : "bg-white text-[#222222] border-black/10 hover:border-[#0A6847]/40"
                  }`}
                >
                  <span className="block text-sm font-bold">{lang.label}</span>
                  <span className={`text-[11px] block mt-0.5 ${locale === lang.code ? "text-emerald-100" : "text-[#777777]"}`}>
                    {lang.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Text Size (Accessibility for Senior Readers) */}
          <div className="space-y-2.5 pt-4 border-t border-black/8">
            <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil flex items-center gap-1.5">
              <Type className="h-4 w-4 text-[#0A6847]" />
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
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-tamil ${
                    fontSize === item.size
                      ? "bg-[#0A6847] text-white border-[#0A6847] shadow-sm"
                      : "bg-white text-[#222222] border-black/10 hover:border-[#0A6847]/40"
                  }`}
                >
                  <span className="block text-xs font-bold">{item.label}</span>
                  <span className={`text-[10px] block mt-0.5 font-mono ${fontSize === item.size ? "text-emerald-100" : "text-[#777777]"}`}>
                    {item.preview}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Reading Background Theme */}
          <div className="space-y-2.5 pt-4 border-t border-black/8">
            <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-[#0A6847]" />
              <span>{t("themeLabel")}</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { theme: "parchment" as ReadingTheme, label: t("themeParchment"), bg: "bg-[#FAFAF9]" },
                { theme: "white" as ReadingTheme, label: t("themeWhite"), bg: "bg-white" },
                { theme: "night" as ReadingTheme, label: t("themeNight"), bg: "bg-neutral-900 text-white" },
              ].map((item) => (
                <button
                  key={item.theme}
                  type="button"
                  onClick={() => setReadingTheme(item.theme)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-tamil ${
                    readingTheme === item.theme
                      ? "ring-2 ring-[#0A6847] border-[#0A6847] shadow-sm"
                      : "border-black/10 hover:border-[#0A6847]/40"
                  } ${item.bg}`}
                >
                  <span className="block text-xs font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Shipping Region Preference */}
          <div className="space-y-2.5 pt-4 border-t border-black/8">
            <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#0A6847]" />
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
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer font-tamil ${
                    shippingRegion === r.region
                      ? "bg-[#0A6847] text-white border-[#0A6847] shadow-sm"
                      : "bg-white text-[#222222] border-black/10 hover:border-[#0A6847]/40"
                  }`}
                >
                  <span className="block text-xs font-bold leading-snug">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Postal Address for WhatsApp Autofill */}
          <div className="space-y-3 pt-4 border-t border-black/8">
            <div>
              <label className="text-xs font-bold text-[#333333] uppercase tracking-wider block font-tamil">
                {t("savedAddressLabel")}
              </label>
              <p className="text-xs text-[#666666] font-tamil mt-0.5">
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
                  className="px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-white font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]"
                />
                <input
                  type="tel"
                  placeholder={isTa ? "தொலைபேசி எண் (Phone / WA)" : "Phone Number"}
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-white font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]"
                />
              </div>

              <input
                type="text"
                placeholder={isTa ? "கதவு எண், தெரு முகவரி (Door No, Street Address)" : "Street Address"}
                value={addressForm.doorStreet}
                onChange={(e) => setAddressForm({ ...addressForm, doorStreet: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-white font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder={isTa ? "நகரம் / ஊர் (City)" : "City"}
                  value={addressForm.cityArea}
                  onChange={(e) => setAddressForm({ ...addressForm, cityArea: e.target.value })}
                  className="px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-white font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]"
                />
                <input
                  type="text"
                  placeholder={isTa ? "மாவட்டம் / மாநிலம்" : "State"}
                  value={addressForm.districtState}
                  onChange={(e) => setAddressForm({ ...addressForm, districtState: e.target.value })}
                  className="px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-white font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]"
                />
                <input
                  type="text"
                  placeholder={isTa ? "அஞ்சல் குறியீடு (Pincode)" : "Pincode"}
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className="px-3.5 py-2.5 text-xs rounded-xl border border-black/10 bg-white font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]"
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
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085237] text-white text-xs font-bold transition-all shadow-xs font-tamil cursor-pointer"
                >
                  {t("saveChanges")}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-black/[0.03] border-t border-black/8 flex items-center justify-end">
          <button
            type="button"
            onClick={closeSettings}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-white border border-black/10 text-xs font-bold text-[#333333] hover:bg-black/5 transition-colors font-tamil cursor-pointer"
          >
            {isTa ? "முடிந்தது (Done)" : "Done"}
          </button>
        </div>

      </div>
    </div>
  );
}

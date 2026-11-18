"use client";

import * as React from "react";
import { type Locale, type TranslationKey, getTranslation } from "@/lib/translations";
import { Toast, type ToastData } from "@/components/ui/Toast";

export type { Locale, ToastData };

export type FontSize = "normal" | "large" | "extra-large";
export type ReadingTheme = "parchment" | "white" | "night";
export type ShippingRegion = "tamil-nadu" | "other-india" | "diaspora";

export interface UserDeliveryAddress {
  fullName: string;
  phone: string;
  doorStreet: string;
  cityArea: string;
  districtState: string;
  pincode: string;
}

interface LanguageContextType {
  locale: Locale;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  
  // Settings Options
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  readingTheme: ReadingTheme;
  setReadingTheme: (theme: ReadingTheme) => void;
  shippingRegion: ShippingRegion;
  setShippingRegion: (region: ShippingRegion) => void;
  
  // Delivery Address & Privacy
  deliveryAddress: UserDeliveryAddress;
  setDeliveryAddress: (address: UserDeliveryAddress) => void;
  getFormattedAddress: () => string;
  clearSensitiveStorage: () => void;

  // Saved Bookmarks / Wishlist
  wishlist: string[];
  toggleWishlist: (bookId: string, bookTitleTa?: string, bookTitleEn?: string) => void;
  isInWishlist: (bookId: string) => boolean;

  // Global Micro-Toast Notification
  toast: ToastData | null;
  showToast: (data: Omit<ToastData, "id">) => void;
  hideToast: () => void;

  // Settings modal state
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const defaultAddress: UserDeliveryAddress = {
  fullName: "",
  phone: "",
  doorStreet: "",
  cityArea: "",
  districtState: "தமிழ்நாடு (Tamil Nadu)",
  pincode: "",
};

const LanguageContext = React.createContext<LanguageContextType>({
  locale: "ta",
  toggleLocale: () => {},
  setLocale: () => {},
  t: (key) => key,
  fontSize: "normal",
  setFontSize: () => {},
  readingTheme: "parchment",
  setReadingTheme: () => {},
  shippingRegion: "tamil-nadu",
  setShippingRegion: () => {},
  deliveryAddress: defaultAddress,
  setDeliveryAddress: () => {},
  getFormattedAddress: () => "",
  clearSensitiveStorage: () => {},
  wishlist: [],
  toggleWishlist: () => {},
  isInWishlist: () => false,
  toast: null,
  showToast: () => {},
  hideToast: () => {},
  isSettingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("ta");
  const [fontSize, setFontSizeState] = React.useState<FontSize>("normal");
  const [readingTheme, setReadingThemeState] = React.useState<ReadingTheme>("parchment");
  const [shippingRegion, setShippingRegionState] = React.useState<ShippingRegion>("tamil-nadu");
  const [deliveryAddress, setDeliveryAddressState] = React.useState<UserDeliveryAddress>(defaultAddress);
  const [wishlist, setWishlistState] = React.useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [toast, setToast] = React.useState<ToastData | null>(null);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize and persist preferences safely
  React.useEffect(() => {
    try {
      const savedLocale = localStorage.getItem("preferred_locale") as Locale;
      if (savedLocale === "ta" || savedLocale === "en") {
        setLocaleState(savedLocale);
      }

      const savedFontSize = localStorage.getItem("mk_font_size") as FontSize;
      if (savedFontSize) {
        setFontSizeState(savedFontSize);
      }

      const savedTheme = localStorage.getItem("mk_reading_theme") as ReadingTheme;
      if (savedTheme) {
        setReadingThemeState(savedTheme);
      }

      const savedRegion = localStorage.getItem("mk_shipping_region") as ShippingRegion;
      if (savedRegion) {
        setShippingRegionState(savedRegion);
      }

      const savedAddr = localStorage.getItem("mk_delivery_address");
      if (savedAddr) {
        setDeliveryAddressState(JSON.parse(savedAddr));
      }

      const savedWishlist = localStorage.getItem("mk_wishlist");
      if (savedWishlist) {
        setWishlistState(JSON.parse(savedWishlist));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Synchronize CSS attributes on root html tag
  React.useEffect(() => {
    try {
      const root = document.documentElement;
      root.lang = locale === "ta" ? "ta" : "en";
      root.setAttribute("data-font-size", fontSize);
      root.setAttribute("data-theme", readingTheme);
    } catch {
      // Ignore
    }
  }, [locale, fontSize, readingTheme]);

  const setLocale = React.useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("preferred_locale", newLocale);
    } catch {}
  }, []);

  const toggleLocale = React.useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "ta" ? "en" : "ta";
      try {
        localStorage.setItem("preferred_locale", next);
      } catch {}
      return next;
    });
  }, []);

  const setFontSize = React.useCallback((size: FontSize) => {
    setFontSizeState(size);
    try {
      localStorage.setItem("mk_font_size", size);
    } catch {}
  }, []);

  const setReadingTheme = React.useCallback((theme: ReadingTheme) => {
    setReadingThemeState(theme);
    try {
      localStorage.setItem("mk_reading_theme", theme);
    } catch {}
  }, []);

  const setShippingRegion = React.useCallback((region: ShippingRegion) => {
    setShippingRegionState(region);
    try {
      localStorage.setItem("mk_shipping_region", region);
    } catch {}
  }, []);

  const setDeliveryAddress = React.useCallback((address: UserDeliveryAddress) => {
    setDeliveryAddressState(address);
    try {
      localStorage.setItem("mk_delivery_address", JSON.stringify(address));
    } catch {}
  }, []);

  const getFormattedAddress = React.useCallback((): string => {
    if (!deliveryAddress.fullName || !deliveryAddress.doorStreet) return "";
    return `${deliveryAddress.fullName}, ${deliveryAddress.doorStreet}, ${deliveryAddress.cityArea}, ${deliveryAddress.districtState} - ${deliveryAddress.pincode} (தொலைபேசி: ${deliveryAddress.phone})`;
  }, [deliveryAddress]);

  const clearSensitiveStorage = React.useCallback(() => {
    try {
      localStorage.removeItem("mk_delivery_address");
      setDeliveryAddressState(defaultAddress);
    } catch (e) {
      console.error("Failed to clear sensitive storage:", e);
    }
  }, []);

  const hideToast = React.useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = React.useCallback(
    (data: Omit<ToastData, "id">) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      const newToast: ToastData = {
        ...data,
        id: Date.now().toString(),
      };
      setToast(newToast);

      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, 3800);
    },
    []
  );

  const toggleWishlist = React.useCallback(
    (bookId: string, bookTitleTa?: string, bookTitleEn?: string) => {
      setWishlistState((prev) => {
        const exists = prev.includes(bookId);
        const next = exists ? prev.filter((id) => id !== bookId) : [...prev, bookId];
        try {
          localStorage.setItem("mk_wishlist", JSON.stringify(next));
        } catch {}

        if (!exists) {
          showToast({
            type: "wishlist",
            titleTa: "விருப்பப் பட்டியல்",
            titleEn: "Reading Wishlist",
            messageTa: bookTitleTa
              ? `"${bookTitleTa}" உங்கள் விருப்பப் பட்டியலில் சேர்க்கப்பட்டது.`
              : "நூல் உங்கள் விருப்பப் பட்டியலில் சேர்க்கப்பட்டது.",
            messageEn: bookTitleEn
              ? `"${bookTitleEn}" has been added to your wishlist.`
              : "Book added to your reading wishlist.",
            actionLabelTa: "பட்டியல் காண்க",
            actionLabelEn: "View Wishlist",
            actionHref: "/account",
          });
        } else {
          showToast({
            type: "info",
            titleTa: "விருப்பப் பட்டியல்",
            titleEn: "Reading Wishlist",
            messageTa: "நூல் விருப்பப் பட்டியலிலிருந்து நீக்கப்பட்டது.",
            messageEn: "Book removed from your wishlist.",
          });
        }

        return next;
      });
    },
    [showToast]
  );

  const isInWishlist = React.useCallback(
    (bookId: string) => wishlist.includes(bookId),
    [wishlist]
  );

  const t = React.useCallback(
    (key: TranslationKey) => getTranslation(key, locale),
    [locale]
  );

  const openSettings = React.useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = React.useCallback(() => setIsSettingsOpen(false), []);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        toggleLocale,
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
        getFormattedAddress,
        clearSensitiveStorage,
        wishlist,
        toggleWishlist,
        isInWishlist,
        toast,
        showToast,
        hideToast,
        isSettingsOpen,
        openSettings,
        closeSettings,
      }}
    >
      {children}
      <Toast toast={toast} onClose={hideToast} locale={locale} />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return React.useContext(LanguageContext);
}

"use client";

import * as React from "react";
import { getSupabaseStorageUrl } from "@/lib/book-images";

export interface CartItem {
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

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: string, newQty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  isLoaded: boolean;
}

const CartContext = React.createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  subtotal: 0,
  totalItems: 0,
  isLoaded: false,
});

const CATALOG_SYNC_TTL_MS = 2 * 60 * 1000;
let inFlightCatalogSync: Promise<any[] | null> | null = null;

function fetchCatalogOnce(): Promise<any[] | null> {
  if (!inFlightCatalogSync) {
    inFlightCatalogSync = fetch("/api/books?limit=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (Array.isArray(data?.books) ? data.books : null))
      .catch(() => null)
      .finally(() => {
        inFlightCatalogSync = null;
      });
  }
  return inFlightCatalogSync;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load from localStorage on client mount & reconcile prices/stock with live catalog
  React.useEffect(() => {
    let active = true;
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    if (currentPath.startsWith("/admin")) {
      setIsLoaded(true);
      return undefined;
    }

    let initialItems: CartItem[] = [];
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (process.env.NODE_ENV !== "production" && params.get("preview") === "cart") {
          setItems([
            {
              id: "b0000000-0000-0000-0000-000000000001",
              title: "களத்தில் கேட்டவை",
              titleEn: "Heard on the Battlefield",
              author: "சு. ரவி (எள்ளாளன்)",
              authorEn: "S. Ravi (Ellalan)",
              price: 180,
              image: getSupabaseStorageUrl("books", "book-20.webp"),
              slug: "katunayake-attack-victory",
              quantity: 2,
              maxStock: 50,
            },
            {
              id: "b0000000-0000-0000-0000-000000000002",
              title: "நெஞ்சூரம்",
              titleEn: "Courage of Heart",
              author: "மு. வே. யோகநாதன்",
              authorEn: "M. V. Yoganathan",
              price: 250,
              image: getSupabaseStorageUrl("books", "book-16.webp"),
              slug: "nenjuram",
              quantity: 1,
              maxStock: 25,
            },
            {
              id: "b0000000-0000-0000-0000-000000000003",
              title: "திசை தவறா கணை — தளபதி விநாயகத்தின் வாழ்க்கை வரலாற்றுப் புத்தகம்",
              titleEn: "Dhisai Thavara Kanai - Biography of Commander Vinayagam",
              author: "சேரன்",
              authorEn: "Cheran",
              price: 350,
              image: getSupabaseStorageUrl("books", "book-13.webp"),
              slug: "dhisai-thavara-kanai",
              quantity: 1,
              maxStock: 10,
            },
          ]);
          setIsLoaded(true);
          return undefined;
        }
      }
      const savedCart = localStorage.getItem("mk_cart_items");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          initialItems = parsed;
          setItems(parsed);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
      setItems([]);
    } finally {
      setIsLoaded(true);
    }

    const lastSyncedAt = (() => {
      try {
        return Number(sessionStorage.getItem("mk_cart_catalog_sync_ts") || 0);
      } catch {
        return 0;
      }
    })();
    const isCartPage = currentPath.startsWith("/cart");
    const shouldReconcile =
      initialItems.length > 0 &&
      (isCartPage || Date.now() - lastSyncedAt > CATALOG_SYNC_TTL_MS);

    if (shouldReconcile) {
      fetchCatalogOnce()
        .then((books) => {
          if (!active || !books) return;
          try {
            sessionStorage.setItem("mk_cart_catalog_sync_ts", String(Date.now()));
          } catch {}
          const liveById = new Map<string, any>();
          const liveBySlug = new Map<string, any>();
          for (const b of books) {
            if (b?.id) liveById.set(String(b.id), b);
            if (b?.slug) liveBySlug.set(String(b.slug), b);
          }

          setItems((current) => {
            if (current.length === 0) return current;
            let changed = false;
            const reconciled: CartItem[] = [];

            for (const item of current) {
              const live = liveById.get(item.id) || liveBySlug.get(item.slug);
              if (!live) {
                reconciled.push(item);
                continue;
              }
              const liveStock = Number(live.stock ?? item.maxStock);
              if (liveStock <= 0) {
                changed = true;
                continue;
              }
              const livePrice = Number(live.discountPrice ?? live.discount_price ?? live.price ?? item.price);
              const clampedQty = Math.min(item.quantity, liveStock);
              const nextImage = live.image || live.cover_front || item.image;
              const nextTitle = live.title || item.title;
              const nextTitleEn = live.titleEn || live.title_en || item.titleEn;

              if (
                livePrice !== item.price ||
                liveStock !== item.maxStock ||
                clampedQty !== item.quantity ||
                nextImage !== item.image ||
                nextTitle !== item.title ||
                nextTitleEn !== item.titleEn ||
                live.id !== item.id
              ) {
                changed = true;
                reconciled.push({
                  ...item,
                  id: String(live.id || item.id),
                  title: nextTitle,
                  titleEn: nextTitleEn,
                  price: livePrice,
                  image: nextImage,
                  maxStock: liveStock,
                  quantity: clampedQty,
                });
              } else {
                reconciled.push(item);
              }
            }

            if (changed) {
              try {
                localStorage.setItem("mk_cart_items", JSON.stringify(reconciled));
              } catch {}
              return reconciled;
            }
            return current;
          });
        });
    }

    return () => {
      active = false;
    };
  }, []);

  const addToCart = React.useCallback(
    (item: CartItem) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        let next: CartItem[];
        if (existing) {
          next = prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + item.quantity, i.maxStock),
                }
              : i
          );
        } else {
          next = [...prev, item];
        }
        try {
          localStorage.setItem("mk_cart_items", JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const updateQuantity = React.useCallback((id: string, newQty: number) => {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Math.min(newQty, item.maxStock)) } : item
      );
      try {
        localStorage.setItem("mk_cart_items", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("mk_cart_items", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem("mk_cart_items");
    } catch {}
  }, []);

  const subtotal = React.useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const totalItems = React.useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        totalItems,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return React.useContext(CartContext);
}

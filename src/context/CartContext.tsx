"use client";

import * as React from "react";

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load from localStorage on client mount (clean start if empty)
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("preview") === "cart") {
          setItems([
            {
              id: "b0000000-0000-0000-0000-000000000001",
              title: "களத்தில் கேட்டவை",
              titleEn: "Heard on the Battlefield",
              author: "சு. ரவி (எள்ளாளன்)",
              authorEn: "S. Ravi (Ellalan)",
              price: 180,
              image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/books/book-20.webp",
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
              image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/books/book-16.webp",
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
              image: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/books/book-13.webp",
              slug: "dhisai-thavara-kanai",
              quantity: 1,
              maxStock: 10,
            },
          ]);
          setIsLoaded(true);
          return;
        }
      }
      const savedCart = localStorage.getItem("mk_cart_items");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setItems(parsed);
          setIsLoaded(true);
          return;
        }
      }
      setItems([]);
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
      setItems([]);
    } finally {
      setIsLoaded(true);
    }
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

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

  // Save to localStorage when items change
  const saveItems = React.useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem("mk_cart_items", JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
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

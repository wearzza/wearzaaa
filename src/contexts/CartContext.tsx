import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product } from '../lib/supabase';

export interface CartItem { product: Product; quantity: number; selectedSize?: string; }

interface CartCtx {
  items: CartItem[];
  addToCart: (p: Product, qty?: number, selectedSize?: string) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((p: Product, qty = 1, selectedSize?: string) => {
    setItems(prev => {
      const ex = prev.find(i => i.product.id === p.id && i.selectedSize === selectedSize);
      return ex
        ? prev.map(i => i.product.id === p.id && i.selectedSize === selectedSize ? { ...i, quantity: i.quantity + qty } : i)
        : [...prev, { product: p, quantity: qty, selectedSize }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => setItems(p => p.filter(i => i.product.id !== id)), []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) setItems(p => p.filter(i => i.product.id !== id));
    else setItems(p => p.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <Ctx.Provider value={{
      items, addToCart, removeFromCart, updateQty, clearCart,
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: items.reduce((s, i) => s + i.product.real_price * i.quantity, 0),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart outside CartProvider');
  return c;
}

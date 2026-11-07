import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product } from '../lib/supabase';
import { cartKey, itemPrice, itemStock, selectionFor } from '../lib/productVariants';

export interface CartItem { product: Product; quantity: number; selectedSize?: string; variantId?: string; }

interface CartCtx {
  items: CartItem[];
  addToCart: (p: Product, qty?: number, selectedSize?: string, variantId?: string) => boolean;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((p: Product, qty = 1, selectedSize?: string, variantId?: string) => {
    const variant = selectionFor(p, variantId);
    if (!p.is_active || (p.variants?.length && !variant)) return false;
    const item = { product: p, quantity: qty, selectedSize: variant?.size || selectedSize, variantId };
    if (itemStock(item) < 1 || qty < 1) return false;
    setItems(prev => {
      const ex = prev.find(i => cartKey(i) === cartKey(item));
      return ex
        ? prev.map(i => cartKey(i) === cartKey(item) ? { ...item, quantity: Math.min(itemStock(item), i.quantity + qty) } : i)
        : [...prev, { ...item, quantity: Math.min(itemStock(item), qty) }];
    });
    return true;
  }, []);

  const removeFromCart = useCallback((id: string) => setItems(p => p.filter(i => cartKey(i) !== id)), []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) setItems(p => p.filter(i => cartKey(i) !== id));
    else setItems(p => p.map(i => cartKey(i) === id ? { ...i, quantity: Math.min(itemStock(i), qty) } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <Ctx.Provider value={{
      items, addToCart, removeFromCart, updateQty, clearCart,
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: items.reduce((s, i) => s + itemPrice(i) * i.quantity, 0),
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

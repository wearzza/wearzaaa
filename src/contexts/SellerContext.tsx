import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Seller } from '../lib/supabase';

interface SellerCtx {
  seller: Seller | null;
  setSeller: (s: Seller | null) => void;
  logout: () => void;
}

const Ctx = createContext<SellerCtx | null>(null);

export function SellerProvider({ children }: { children: ReactNode }) {
  const [seller, setSeller] = useState<Seller | null>(() => {
    try { return JSON.parse(localStorage.getItem('wearza_seller') || 'null'); }
    catch { return null; }
  });

  const set = useCallback((s: Seller | null) => {
    setSeller(s);
    if (s) localStorage.setItem('wearza_seller', JSON.stringify(s));
    else localStorage.removeItem('wearza_seller');
  }, []);

  const logout = useCallback(() => {
    setSeller(null);
    localStorage.removeItem('wearza_seller');
  }, []);

  return <Ctx.Provider value={{ seller, setSeller: set, logout }}>{children}</Ctx.Provider>;
}

export function useSeller() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSeller outside SellerProvider');
  return c;
}

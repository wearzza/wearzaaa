import { ShoppingCart, Search, Menu, X, User, Clock, Store } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { supabase, Product, Seller } from '../../lib/supabase';
import { useCategories, searchProducts } from '../../lib/catalog';

interface Props {
  onCartOpen: () => void;
  onSearch: (q: string) => void;
  searchQuery: string;
  onPageChange: (p: string) => void;
  currentPage: string;
  onProductClick?: (p: Product) => void;
  onShopClick?: (s: Seller) => void;
}

const RECENT_KEY = 'wearza_recent_searches';

export default function Navbar({ onCartOpen, onSearch, searchQuery, onPageChange, currentPage, onProductClick, onShopClick }: Props) {
  const { totalItems } = useCart();
  const cats = useCategories();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(searchQuery);
  const [pool, setPool] = useState<Product[] | null>(null);
  const [shops, setShops] = useState<Seller[]>([]);
  const [recent, setRecent] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(searchQuery), [searchQuery]);
  useEffect(() => {
    if (!focused || pool) return;
    Promise.all([
      supabase.from('products').select('*, sellers!inner(*)').eq('is_active', true).eq('sellers.status', 'approved').limit(300),
      supabase.from('sellers').select('*').eq('status', 'approved').limit(100),
    ]).then(([p, s]) => { setPool(p.data || []); setShops(s.data || []); });
  }, [focused, pool]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  function submit(q: string) {
    const v = q.trim();
    onSearch(v); setFocused(false);
    if (v) { const next = [v, ...recent.filter(r => r !== v)].slice(0, 6); setRecent(next); localStorage.setItem(RECENT_KEY, JSON.stringify(next)); onPageChange('home'); }
  }

  const q = draft.trim().toLowerCase();
  const prodHits = q && pool ? searchProducts(pool, q, cats).slice(0, 5) : [];
  const catHits = q ? cats.filter(c => c.label.toLowerCase().includes(q) || c.slug.includes(q)).slice(0, 4) : [];
  const shopHits = q ? shops.filter(s => s.business_name.toLowerCase().includes(q)).slice(0, 3) : [];

  const searchBox = (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={e => { e.preventDefault(); submit(draft); }} className="flex items-center rounded-full border-2 border-primary/80 bg-card overflow-hidden focus-within:border-primary transition-colors">
        <Search className="ml-4 text-muted-foreground flex-shrink-0" size={17} />
        <input
          type="search" placeholder="Search t-shirts, jeans, kurtas, shops…" value={draft}
          onFocus={() => setFocused(true)}
          onChange={e => { setDraft(e.target.value); if (!e.target.value) onSearch(''); }}
          className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent focus:outline-none text-foreground"
        />
        {draft && <button type="button" aria-label="Clear search" onClick={() => { setDraft(''); onSearch(''); }} className="px-2 text-muted-foreground"><X size={16} /></button>}
        <button type="submit" className="bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold">Search</button>
      </form>
      {focused && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto p-2">
          {!q && (recent.length ? <>
            <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Recent</p>
            {recent.map(r => <button key={r} onClick={() => { setDraft(r); submit(r); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted text-left text-foreground"><Clock size={14} className="text-muted-foreground" />{r}</button>)}
          </> : <p className="px-3 py-3 text-sm text-muted-foreground">Try “black hoodie”, “kurta women” or a shop name</p>)}
          {q && catHits.length > 0 && <div className="flex flex-wrap gap-2 px-2 py-2">{catHits.map(c => <button key={c.slug} onClick={() => { onSearch(''); setFocused(false); onPageChange(c.slug); }} className="px-3 py-1 rounded-full bg-muted text-xs font-semibold text-foreground">{c.icon} {c.label}</button>)}</div>}
          {q && prodHits.map(p => (
            <button key={p.id} onClick={() => { setFocused(false); onProductClick?.(p); }} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted text-left">
              <img src={p.image_urls?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted" />
              <span className="flex-1 min-w-0"><span className="block text-sm font-medium text-foreground truncate">{p.name}</span><span className="block text-xs text-muted-foreground truncate">{p.sellers?.business_name}</span></span>
              <span className="text-sm font-bold text-primary">Rs. {p.real_price}</span>
            </button>
          ))}
          {q && shopHits.map(s => <button key={s.id} onClick={() => { setFocused(false); onShopClick?.(s); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted text-left text-foreground"><Store size={14} className="text-muted-foreground" />{s.business_name}</button>)}
          {q && <button onClick={() => submit(draft)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-muted text-left">See all results for “{draft}”</button>}
        </div>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          <button onClick={() => { onSearch(''); onPageChange('home'); }} className="flex-shrink-0">
            <img src="/assets/images/f5843efc-6c3d-47ff-b16f-26605943a43c.png" alt="Wearza" className="h-8 object-contain" />
          </button>
          <div className="flex-1 max-w-2xl hidden md:block">{searchBox}</div>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => onPageChange('orders')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-foreground hover:bg-muted">
              <User size={16} /><span>Orders</span>
            </button>
            <button onClick={onCartOpen} aria-label="Cart" className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted">
              <ShoppingCart size={19} className="text-foreground" />
              {totalItems > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center">{totalItems > 9 ? '9+' : totalItems}</span>}
            </button>
            <button onClick={() => setMobileOpen(m => !m)} aria-label="Menu" className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted">
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        <div className="md:hidden pb-3">{searchBox}</div>
        <div className="flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
          {[{ slug: 'home', label: 'Home', icon: '' }, ...cats].map(l => (
            <button key={l.slug} onClick={() => { onSearch(''); onPageChange(l.slug); }}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${currentPage === l.slug ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3">
          <button onClick={() => { onPageChange('orders'); setMobileOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted flex items-center gap-2"><User size={16} /> My Orders</button>
        </div>
      )}
    </nav>
  );
}

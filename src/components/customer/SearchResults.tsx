import { useMemo, useState } from 'react';
import { Product } from '../../lib/supabase';
import ProductCard from './ProductCard';
import { Category, searchProducts } from '../../lib/catalog';
import { SlidersHorizontal } from 'lucide-react';

type Sort = 'best' | 'low' | 'high' | 'new' | 'rating';
const PRICES = [{ l: 'Any price', min: 0, max: Infinity }, { l: 'Under Rs. 500', min: 0, max: 500 }, { l: 'Rs. 500–1500', min: 500, max: 1500 }, { l: 'Rs. 1500–3000', min: 1500, max: 3000 }, { l: 'Above Rs. 3000', min: 3000, max: Infinity }];

export default function SearchResults({ query, products, cats, loading, onProductClick }: { query: string; products: Product[]; cats: Category[]; loading: boolean; onProductClick: (p: Product) => void }) {
  const [cat, setCat] = useState('');
  const [price, setPrice] = useState(0);
  const [sort, setSort] = useState<Sort>('best');
  const [minRating, setMinRating] = useState(0);
  const [onSale, setOnSale] = useState(false);

  const matched = useMemo(() => searchProducts(products, query, cats), [products, query, cats]);
  const fallback = useMemo(() => {
    if (matched.length) return [];
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const hits = new Map<string, Product>();
    words.forEach(w => searchProducts(products, w, cats).forEach(p => hits.set(p.id, p)));
    return [...hits.values()].slice(0, 20);
  }, [matched, products, query, cats]);

  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    matched.forEach(p => (p.categories?.length ? p.categories : [p.category]).forEach(c => m.set(c, (m.get(c) || 0) + 1)));
    return m;
  }, [matched]);

  const list = useMemo(() => {
    const pr = PRICES[price];
    let r = matched.filter(p => {
      const cs = p.categories?.length ? p.categories : [p.category];
      return (!cat || (cs as string[]).includes(cat)) && p.real_price >= pr.min && p.real_price <= pr.max && (p.avg_rating || 0) >= minRating && (!onSale || (p.cut_price && p.cut_price > p.real_price));
    });
    if (sort === 'low') r = [...r].sort((a, b) => a.real_price - b.real_price);
    if (sort === 'high') r = [...r].sort((a, b) => b.real_price - a.real_price);
    if (sort === 'new') r = [...r].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    if (sort === 'rating') r = [...r].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    return r;
  }, [matched, cat, price, sort, minRating, onSale]);

  const chip = (on: boolean) => `px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground">Results for “{query}”</h2>
          <p className="text-sm text-muted-foreground">{loading ? 'Searching…' : `${list.length} item${list.length === 1 ? '' : 's'} found`}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">Sort by
          <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
            <option value="best">Best match</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="new">Newest</option><option value="rating">Top rated</option>
          </select>
        </label>
      </div>

      {matched.length > 0 && (
        <div className="space-y-2 mb-5 bg-card border border-border rounded-2xl p-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <SlidersHorizontal size={15} className="text-muted-foreground shrink-0" />
            <button className={chip(!cat)} onClick={() => setCat('')}>All ({matched.length})</button>
            {cats.filter(c => catCounts.has(c.slug)).map(c => <button key={c.slug} className={chip(cat === c.slug)} onClick={() => setCat(cat === c.slug ? '' : c.slug)}>{c.icon} {c.label} ({catCounts.get(c.slug)})</button>)}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {PRICES.map((p, i) => <button key={p.l} className={chip(price === i)} onClick={() => setPrice(i)}>{p.l}</button>)}
            <button className={chip(minRating === 4)} onClick={() => setMinRating(minRating === 4 ? 0 : 4)}>★ 4 & up</button>
            <button className={chip(onSale)} onClick={() => setOnSale(!onSale)}>On sale</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="bg-muted rounded-2xl animate-pulse" style={{ paddingBottom: '120%' }} />)}
        </div>
      ) : list.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {list.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
        </div>
      ) : (
        <div>
          <div className="text-center py-10">
            <p className="font-semibold text-foreground">No exact matches{matched.length ? ' for these filters' : ''}</p>
            <p className="text-sm text-muted-foreground">Try fewer words, check spelling, or remove a filter.</p>
          </div>
          {fallback.length > 0 && <>
            <h3 className="font-bold text-foreground mb-3">You may also like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {fallback.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

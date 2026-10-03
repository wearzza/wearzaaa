import { useEffect, useMemo, useState } from 'react';
import { supabase, Product, Seller, Review } from '../../lib/supabase';
import { useCategories, searchProducts, shopUrl } from '../../lib/catalog';
import ProductCard from './ProductCard';
import StarRating from '../StarRating';
import { ArrowLeft, BadgeCheck, MapPin, Instagram, Share2, Package, Star, Calendar, Search } from 'lucide-react';

interface Props { handle?: string; seller?: Seller | null; onBack: () => void; onProductClick: (p: Product) => void }

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

export default function ShopPage({ handle, seller: initial, onBack, onProductClick }: Props) {
  const cats = useCategories();
  const [seller, setSeller] = useState<Seller | null>(initial || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setNotFound(false);
      let s = initial || null;
      if (!s && handle) {
        const h = handle.toLowerCase();
        let res = await supabase.from('sellers').select('*').eq('shop_slug', h).maybeSingle();
        if (res.error || !res.data) {
          const all = await supabase.from('sellers').select('*').eq('status', 'approved');
          s = (all.data || []).find(x => x.id === h || (!isUuid(h) && x.id.startsWith(h))) || null;
        } else s = res.data as Seller;
      }
      if (!active) return;
      if (!s || s.status !== 'approved') { setNotFound(true); setLoading(false); return; }
      setSeller(s);
      const [p, r] = await Promise.all([
        supabase.from('products').select('*, sellers(*)').eq('seller_id', s.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').eq('seller_id', s.id).order('created_at', { ascending: false }).limit(20),
      ]);
      if (!active) return;
      setProducts(p.data || []); setReviews(r.data || []); setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [handle, initial]);

  const shopCats = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => (p.categories?.length ? p.categories : [p.category]).forEach(c => set.add(c)));
    return [...set];
  }, [products]);

  let list = tab === 'all' ? products : products.filter(p => (p.categories?.length ? p.categories : [p.category]).includes(tab as never));
  if (q) list = searchProducts(list, q, cats);

  const rated = products.filter(p => p.review_count > 0);
  const avg = rated.length ? rated.reduce((a, p) => a + p.avg_rating, 0) / rated.length : 0;

  async function share() {
    if (!seller) return;
    const url = shopUrl(seller);
    if (navigator.share) { try { await navigator.share({ title: seller.business_name, url }); return; } catch { /* fallthrough */ } }
    await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  if (notFound) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-foreground mb-2">Shop not available</h1>
      <p className="text-sm text-muted-foreground mb-6">This shop link is wrong or the shop is not active right now.</p>
      <button onClick={onBack} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">Browse Wearza</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-3 hover:text-foreground"><ArrowLeft size={16} /> Back</button>

      <div className="rounded-3xl overflow-hidden bg-card border border-border">
        <div className="h-32 sm:h-48 bg-gradient-to-br from-foreground to-primary" style={seller?.shop_banner_url ? { backgroundImage: `url(${seller.shop_banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
        <div className="px-4 sm:px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-card bg-muted overflow-hidden flex items-center justify-center shadow-lg">
              {seller?.shop_logo_url ? <img src={seller.shop_logo_url} alt={seller.business_name} className="w-full h-full object-cover" /> : <span className="text-3xl font-black text-muted-foreground">{seller?.business_name?.[0] || ''}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-foreground flex items-center gap-2 truncate">{seller?.business_name || 'Loading…'} {seller && <BadgeCheck size={20} className="text-chart-green flex-shrink-0" />}</h1>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {seller?.shop_location && <span className="flex items-center gap-1"><MapPin size={13} />{[seller.municipality, seller.district].filter(Boolean).join(', ') || seller.shop_location}</span>}
                {seller?.created_at && <span className="flex items-center gap-1"><Calendar size={13} />Joined {new Date(seller.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {seller?.instagram && <a href={seller.instagram.startsWith('http') ? seller.instagram : `https://instagram.com/${seller.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted"><Instagram size={17} /></a>}
              <button onClick={share} className="px-4 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2"><Share2 size={15} />{copied ? 'Link copied' : 'Share shop'}</button>
            </div>
          </div>
          {seller?.shop_description && <p className="text-sm text-muted-foreground mt-4 max-w-3xl">{seller.shop_description}</p>}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[{ icon: Package, label: 'Products', value: products.length }, { icon: Star, label: 'Rating', value: avg ? avg.toFixed(1) : '—' }, { icon: BadgeCheck, label: 'Reviews', value: reviews.length }].map(s => (
              <div key={s.label} className="rounded-2xl bg-muted p-3 text-center">
                <s.icon size={16} className="mx-auto text-primary mb-1" />
                <p className="text-lg font-black text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mt-5 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
          {['all', ...shopCats].map(c => (
            <button key={c} onClick={() => setTab(c)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border ${tab === c ? 'bg-foreground text-card border-foreground' : 'border-border text-foreground'}`}>
              {c === 'all' ? 'All' : cats.find(x => x.slug === c)?.label || c}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search this shop" className="w-full pl-9 pr-3 py-2 rounded-full border border-border bg-card text-sm focus:outline-none focus:border-primary" /></div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="bg-muted rounded-2xl animate-pulse" style={{ paddingBottom: '120%' }} />)}</div>
      ) : list.length === 0 ? <p className="text-center py-16 text-muted-foreground">No products found</p> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">{list.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}</div>
      )}

      {reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-foreground mb-3">Customer reviews</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-foreground">{r.reviewer_name}</p><StarRating rating={r.rating} size={12} /></div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

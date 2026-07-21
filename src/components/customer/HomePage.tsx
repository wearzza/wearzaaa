import { useEffect, useState } from 'react';
import { supabase, Product, Seller, Banner } from '../../lib/supabase';
import ProductCard from './ProductCard';
import { Shield, TrendingUp, Tag, Truck, ChevronRight } from 'lucide-react';

interface Props {
  onProductClick: (p: Product) => void;
  onCategoryClick: (c: string) => void;
  searchQuery: string;
}

const CATEGORIES = [
  { id: 'men', label: 'Men', icon: '👔', color: '#3b82f6' },
  { id: 'women', label: 'Women', icon: '👗', color: '#ec4899' },
  { id: 'kids', label: 'Kids', icon: '👶', color: '#f59e0b' },
  { id: 'streetwear', label: 'Streetwear', icon: '🧢', color: '#8b5cf6' },
  { id: 'old_money', label: 'Old Money', icon: '💼', color: '#1a2340' },
  { id: 'budget', label: 'Budget Deals', icon: '💰', color: '#22c55e' },
];

export default function HomePage({ onProductClick, onCategoryClick, searchQuery }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [p, s, b] = await Promise.all([
        supabase.from('products').select('*, sellers!inner(*)').eq('is_active', true).order('created_at', { ascending: false }).limit(24),
        supabase.from('sellers').select('*').eq('status', 'approved').limit(12),
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order', { ascending: true }).limit(1).maybeSingle(),
      ]);
      setProducts(p.data || []);
      setSellers(s.data || []);
      setBanner(b.data as Banner || null);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = searchQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sellers?.business_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  if (searchQuery) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Search results for "{searchQuery}" ({filtered.length})</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl animate-pulse" style={{ paddingBottom: '120%' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No products found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
          </div>
        )}
      </div>
    );
  }

  const featured = filtered.slice(0, 10);
  const budgetDeals = filtered.filter(p => p.category === 'budget').slice(0, 5);

  return (
    <div className="pb-8">
      {/* Hero - Dynamic Banner */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div
          className="relative rounded-3xl overflow-hidden h-56 sm:h-72 md:h-80 flex items-center"
          style={banner?.image_url ? { backgroundImage: `url(${banner.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 20px 60px rgba(26,35,64,0.3)' } : { background: 'linear-gradient(135deg, #1a2340 0%, #2a3360 50%, #ff3b30 120%)', boxShadow: '0 20px 60px rgba(26,35,64,0.3)' }}
        >
          <div className="absolute inset-0" style={{ background: banner?.image_url ? 'linear-gradient(90deg, rgba(26,35,64,0.85) 0%, rgba(26,35,64,0.5) 60%, transparent 100%)' : 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)', opacity: banner?.image_url ? 1 : 0.2 }} />
          <div className="relative z-10 p-8 sm:p-12 max-w-lg">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">NEW COLLECTION 2026</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-3">{banner?.title || 'Fashion that fits your style'}</h1>
            <p className="text-white/80 text-sm sm:text-base mb-6">{banner?.subtitle || 'Shop from verified fashion stores across Nepal. COD available.'}</p>
            <button onClick={() => onCategoryClick(banner?.button_link || 'women')} className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform">{banner?.button_text || 'Shop Now'}</button>
          </div>
          {!banner?.image_url && (<>
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #ff3b30 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute right-10 bottom-0 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
          </>)}
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Shop by Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: cat.color + '15' }}>{cat.icon}</div>
              <span className="text-xs sm:text-sm font-semibold text-gray-700">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Shield, title: 'Verified Stores', desc: 'Every seller verified', color: '#22c55e' },
            { icon: Truck, title: 'Fast Delivery', desc: 'Seller handles shipping', color: '#3b82f6' },
            { icon: Tag, title: 'Best Prices', desc: 'Budget deals daily', color: '#f59e0b' },
            { icon: TrendingUp, title: 'Trending Fashion', desc: 'Latest styles', color: '#ec4899' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: b.color + '15' }}>
                <b.icon size={18} style={{ color: b.color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{b.title}</p>
                <p className="text-xs text-gray-400">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Featured Products</h2>
          <button onClick={() => onCategoryClick('men')} className="text-sm font-medium flex items-center gap-1" style={{ color: '#ff3b30' }}>See all <ChevronRight size={14} /></button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl animate-pulse" style={{ paddingBottom: '120%' }} />)}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">No products yet</p>
            <p className="text-sm mt-1">Be the first to add products!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
          </div>
        )}
      </div>

      {/* Verified Stores */}
      {sellers.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Verified Stores</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {sellers.map(s => (
              <div key={s.id} className="flex-shrink-0 w-40 bg-white rounded-2xl p-4 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {s.shop_logo_url ? <img src={s.shop_logo_url} alt={s.business_name} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-300">{s.business_name[0]}</span>}
                </div>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{s.business_name}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.shop_location}</p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: '#22c55e' }}><Shield size={10} /> Verified</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Deals */}
      {budgetDeals.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Budget Deals</h2>
            <button onClick={() => onCategoryClick('budget')} className="text-sm font-medium flex items-center gap-1" style={{ color: '#ff3b30' }}>See all <ChevronRight size={14} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {budgetDeals.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

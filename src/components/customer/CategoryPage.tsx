import { useEffect, useState } from 'react';
import { supabase, Product } from '../../lib/supabase';
import ProductCard from './ProductCard';
import { SlidersHorizontal, X } from 'lucide-react';

interface Props {
  category: string;
  searchQuery: string;
  onProductClick: (p: Product) => void;
}

const CAT_LABEL: Record<string, string> = { men: 'Men', women: 'Women', kids: 'Kids', streetwear: 'Streetwear', old_money: 'Old Money', budget: 'Budget Deals' };

export default function CategoryPage({ category, searchQuery, onProductClick }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', minRating: 0, sortBy: 'newest' });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('products').select('*, sellers!inner(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      const cat = category as string;
      const matched = (data || []).filter(p => {
        const cats = (p.categories && p.categories.length > 0) ? p.categories : [p.category];
        return cats.includes(cat);
      });
      setProducts(matched);
      setLoading(false);
    }
    load();
  }, [category]);

  let filtered = products;
  if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sellers?.business_name.toLowerCase().includes(searchQuery.toLowerCase()));
  if (filters.minPrice) filtered = filtered.filter(p => p.real_price >= +filters.minPrice);
  if (filters.maxPrice) filtered = filtered.filter(p => p.real_price <= +filters.maxPrice);
  if (filters.minRating) filtered = filtered.filter(p => p.avg_rating >= filters.minRating);
  if (filters.sortBy === 'price-low') filtered = [...filtered].sort((a, b) => a.real_price - b.real_price);
  if (filters.sortBy === 'price-high') filtered = [...filtered].sort((a, b) => b.real_price - a.real_price);
  if (filters.sortBy === 'rating') filtered = [...filtered].sort((a, b) => b.avg_rating - a.avg_rating);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-gray-900">{CAT_LABEL[category] || category}</h1>
        <button onClick={() => setShowFilters(s => !s)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:border-red-400 transition-colors">
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-4 mb-4 space-y-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">Filter & Sort</h3>
            <button onClick={() => setShowFilters(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
              <input type="number" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
              <input type="number" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Min Rating</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => setFilters({ ...filters, minRating: r })} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{ borderColor: filters.minRating === r ? '#ff3b30' : '#e5e7eb', color: filters.minRating === r ? '#ff3b30' : '#6b7280', background: filters.minRating === r ? '#fff1f0' : 'white' }}>
                  {r === 0 ? 'All' : `${r}+★`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sort By</label>
            <select value={filters.sortBy} onChange={e => setFilters({ ...filters, sortBy: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white">
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl animate-pulse" style={{ paddingBottom: '120%' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No products in this category yet</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
        </div>
      )}
    </div>
  );
}

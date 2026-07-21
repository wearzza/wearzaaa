import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Product } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';
import { useState } from 'react';

export default function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const { addToCart } = useCart();
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);

  const discount = product.cut_price
    ? Math.round(((product.cut_price - product.real_price) / product.cut_price) * 100)
    : 0;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 600);
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer group"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.13)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}
    >
      <div className="relative overflow-hidden bg-gray-50" style={{ paddingBottom: '100%' }}>
        <img
          src={product.image_urls[0] || 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{discount}%</span>
        )}
        <button
          onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <Heart size={14} fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : '#9ca3af'} />
        </button>
      </div>

      <div className="p-3">
        <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
          {product.sellers?.business_name || 'Wearza Store'}
        </p>
        <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 leading-tight">{product.name}</h3>

        <div className="flex items-center gap-1 mb-2">
          <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
          <span className="text-xs text-gray-500">
            {product.avg_rating > 0 ? product.avg_rating.toFixed(1) : 'New'} ({product.review_count})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base font-black" style={{ color: '#ff3b30' }}>Rs. {product.real_price.toLocaleString()}</span>
          {product.cut_price && <span className="text-xs text-gray-400 line-through">Rs. {product.cut_price.toLocaleString()}</span>}
        </div>

        <button
          onClick={handleAdd}
          className="mt-3 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          style={{ background: added ? '#22c55e' : '#ff3b30', color: 'white', transform: added ? 'scale(0.95)' : 'scale(1)' }}
        >
          <ShoppingCart size={12} /> {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

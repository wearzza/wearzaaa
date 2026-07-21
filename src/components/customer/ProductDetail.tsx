import { useEffect, useState } from 'react';
import { supabase, Product, Review } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';
import StarRating from '../StarRating';
import { ArrowLeft, ShoppingCart, Zap, Shield, Truck, Star, MessageSquare } from 'lucide-react';

interface Props {
  product: Product;
  onBack: () => void;
  onCheckout: () => void;
}

export default function ProductDetail({ product, onBack, onCheckout }: Props) {
  const { addToCart } = useCart();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false });
      setReviews(data || []);
    }
    load();
  }, [product.id]);

  const discount = product.cut_price ? Math.round(((product.cut_price - product.real_price) / product.cut_price) * 100) : 0;

  async function submitReview() {
    if (!newReview.name.trim() || !newReview.comment.trim()) return;
    setSubmitting(true);
    const { data } = await supabase.from('reviews').insert({
      product_id: product.id, seller_id: product.seller_id,
      reviewer_name: newReview.name, rating: newReview.rating, comment: newReview.comment,
    }).select().single();

    if (data) {
      const all = [data, ...reviews];
      setReviews(all);
      const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
      await supabase.from('products').update({ avg_rating: Math.round(avg * 10) / 10, review_count: all.length }).eq('id', product.id);
    }
    setNewReview({ name: '', rating: 5, comment: '' });
    setShowReviewForm(false);
    setSubmitting(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-4 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        {/* Images */}
        <div>
          <div className="relative bg-gray-50 rounded-2xl overflow-hidden" style={{ paddingBottom: '100%' }}>
            <img src={product.image_urls[activeImage] || 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600'} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            {discount > 0 && <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">-{discount}%</span>}
          </div>
          {product.image_urls.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {product.image_urls.map((url, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors" style={{ borderColor: i === activeImage ? '#ff3b30' : '#e5e7eb' }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {(product.video_data || product.video_url) && <video src={product.video_data || product.video_url} controls className="w-full rounded-2xl bg-black mt-3" />}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm font-medium uppercase tracking-wide mb-1" style={{ color: '#ff3b30' }}>{product.sellers?.business_name}</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">{product.name}</h1>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {(product.categories && product.categories.length > 0 ? product.categories : [product.category]).map((c: string) => (
              <span key={c} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{c.replace('_', ' ')}</span>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.avg_rating} size={18} />
            <span className="text-sm text-gray-500">{product.avg_rating > 0 ? `${product.avg_rating.toFixed(1)} (${product.review_count} reviews)` : 'No reviews yet'}</span>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl font-black" style={{ color: '#ff3b30' }}>Rs. {product.real_price.toLocaleString()}</span>
            {product.cut_price && <span className="text-lg text-gray-400 line-through">Rs. {product.cut_price.toLocaleString()}</span>}
          </div>

          {product.description && (
            <div className="mb-5">
              <h3 className="font-bold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl mb-5">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"><Shield size={18} style={{ color: '#22c55e' }} /></div>
            <div>
              <p className="text-sm font-bold text-gray-800">{product.sellers?.business_name}</p>
              <p className="text-xs text-gray-400">{product.sellers?.shop_location} • Verified Store</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <span className="text-sm font-medium text-gray-700">Size:</span>
            <div className="flex gap-2">
              {['S', 'M', 'L', 'XL', 'Free'].map(sz => (
                <button key={sz} onClick={() => setSelectedSize(sz)} className="w-9 h-9 rounded-lg border text-xs font-bold transition-colors"
                  style={{ borderColor: selectedSize === sz ? '#ff3b30' : '#e5e7eb', color: selectedSize === sz ? '#ff3b30' : '#6b7280', background: selectedSize === sz ? '#fff1f0' : 'white' }}>{sz}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-red-400 transition-colors">−</button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-red-400 transition-colors">+</button>
            </div>
            <span className="text-xs text-gray-400">{product.stock} in stock</span>
          </div>

          <div className="flex gap-3 mb-5">
            <button onClick={() => addToCart(product, quantity, selectedSize)} className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:bg-red-50 active:scale-95" style={{ borderColor: '#ff3b30', color: '#ff3b30' }}>
              <ShoppingCart size={16} className="inline mr-1.5" /> Add to Cart
            </button>
            <button onClick={() => { addToCart(product, quantity, selectedSize); onCheckout(); }} className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, #ff3b30 0%, #e8251a 100%)' }}>
              <Zap size={16} className="inline mr-1.5" /> Buy Now
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-gray-50 rounded-xl"><Truck size={18} className="mx-auto mb-1 text-gray-600" /><p className="text-xs text-gray-500">Seller Delivery</p></div>
            <div className="p-3 bg-gray-50 rounded-xl"><Shield size={18} className="mx-auto mb-1 text-gray-600" /><p className="text-xs text-gray-500">Verified Store</p></div>
            <div className="p-3 bg-gray-50 rounded-xl"><Star size={18} className="mx-auto mb-1 text-gray-600" /><p className="text-xs text-gray-500">COD Available</p></div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Customer Reviews ({reviews.length})</h2>
          <button onClick={() => setShowReviewForm(s => !s)} className="text-sm font-bold px-4 py-2 rounded-xl transition-all" style={{ background: '#fff1f0', color: '#ff3b30' }}>
            <MessageSquare size={14} className="inline mr-1" /> Write Review
          </button>
        </div>

        {showReviewForm && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-4 space-y-3">
            <input type="text" placeholder="Your name" value={newReview.name} onChange={e => setNewReview({ ...newReview, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white" />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Rating</p>
              <StarRating rating={newReview.rating} size={28} interactive onChange={r => setNewReview({ ...newReview, rating: r })} />
            </div>
            <textarea placeholder="Share your experience..." value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white resize-none" />
            <button onClick={submitReview} disabled={submitting || !newReview.name.trim() || !newReview.comment.trim()} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{ background: '#ff3b30' }}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-400"><p>No reviews yet. Be the first to review!</p></div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{r.reviewer_name}</p>
                    <StarRating rating={r.rating} size={14} />
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase, Product, Review } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';
import StarRating from '../StarRating';
import { ArrowLeft, ShoppingCart, Zap, Shield, Truck, Star, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import { sizeLabel } from '../../lib/productVariants';

interface Props {
  product: Product;
  onBack: () => void;
  onCheckout: () => void;
  onShopClick?: (s: import('../../lib/supabase').Seller) => void;
}

export default function ProductDetail({ product, onBack, onCheckout, onShopClick }: Props) {
  const { addToCart } = useCart();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [cartNotice, setCartNotice] = useState('');
  const variants = product.variants || [];
  const variant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
  const price = variant?.price ?? product.real_price;
  const availableStock = variants.length ? variant?.stock || 0 : product.stock;
  const ready = product.is_active && availableStock > 0 && (!variants.length || Boolean(variant));
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

  const discount = product.cut_price ? Math.max(0, Math.round(((product.cut_price - price) / product.cut_price) * 100)) : 0;
  function add(checkout = false) {
    if (!ready) return;
    if (addToCart(product, Math.min(quantity, availableStock), selectedSize, variant?.id)) {
      setCartNotice('Added to your cart.');
      if (checkout) onCheckout();
    }
  }

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
            <span className="text-3xl font-black text-primary">{variants.length && !variant ? 'From ' : ''}Rs. {Number(price).toLocaleString()}</span>
            {product.cut_price && product.cut_price > price && <span className="text-lg text-muted-foreground line-through">Rs. {product.cut_price.toLocaleString()}</span>}
          </div>

          {product.description && (
            <div className="mb-5">
              <h3 className="font-bold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          <button type="button" onClick={() => product.sellers && onShopClick?.(product.sellers)} className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 rounded-2xl mb-5 hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"><Shield size={18} style={{ color: '#22c55e' }} /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{product.sellers?.business_name}</p>
              <p className="text-xs text-gray-400">{product.sellers?.shop_location} • Verified Store</p>
            </div>
            <span className="text-xs font-bold text-primary">Visit shop →</span>
          </button>

          {variants.length > 0 && <div className="space-y-4 mb-5 text-foreground">
            <fieldset><legend className="text-sm font-semibold mb-2">Color{selectedColor ? `: ${selectedColor}` : ''}</legend><div className="flex flex-wrap gap-2">{[...new Set(variants.map(v => v.color))].map(color => <Button key={color} variant={selectedColor === color ? 'primary' : 'outline'} aria-pressed={selectedColor === color} disabled={!variants.some(v => v.color === color && v.stock > 0)} onClick={() => { setSelectedColor(color); if (!variants.some(v => v.color === color && v.size === selectedSize && v.stock > 0)) setSelectedSize(''); setQuantity(1); setCartNotice(''); }}>{color}</Button>)}</div></fieldset>
            <fieldset><legend className="text-sm font-semibold mb-2">Size{selectedSize ? `: ${sizeLabel(selectedSize, product.size_system)}` : ''}</legend><div className="flex flex-wrap gap-2">{[...new Set(variants.map(v => v.size))].map(size => <Button key={size} variant={selectedSize === size ? 'primary' : 'outline'} aria-pressed={selectedSize === size} disabled={!variants.some(v => v.size === size && (!selectedColor || v.color === selectedColor) && v.stock > 0)} onClick={() => { setSelectedSize(size); setQuantity(1); setCartNotice(''); }} className="min-w-10">{sizeLabel(size, product.size_system)}</Button>)}</div></fieldset>
            {variant && (variant.width || variant.length) && <p className="text-xs text-muted-foreground border-y border-border py-3">{variant.width ? `Width: ${variant.width} ${product.measurement_unit || 'cm'}` : ''}{variant.width && variant.length ? ' · ' : ''}{variant.length ? `Length: ${variant.length} ${product.measurement_unit || 'cm'}` : ''}</p>}
            {!variant && <p className="text-xs text-muted-foreground">Select a size and color.</p>}
          </div>}
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <span className="text-sm font-medium text-foreground">Quantity</span>
            <div className="flex items-center gap-2"><Button variant="outline" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 p-0">−</Button><span className="w-10 text-center font-semibold">{quantity}</span><Button variant="outline" aria-label="Increase quantity" disabled={!ready || quantity >= availableStock} onClick={() => setQuantity(q => Math.min(availableStock, q + 1))} className="w-8 h-8 p-0">+</Button></div>
            <span className="text-xs text-muted-foreground">{variants.length && !variant ? `${product.stock} across all options` : `${availableStock} in stock`}</span>
          </div>
          <div className="flex gap-3 mb-3"><Button variant="outline" disabled={!ready} onClick={() => add()} className="flex-1 py-3"><ShoppingCart size={16} />Add to Cart</Button><Button disabled={!ready} onClick={() => add(true)} className="flex-1 py-3"><Zap size={16} />Buy Now</Button></div>
          {cartNotice && <p role="status" className="text-sm text-chart-green mb-3">{cartNotice}</p>}
          <p className="text-sm flex items-center gap-2 mb-5 text-chart-green"><Truck size={16} />{product.free_delivery ? 'Free delivery' : 'Delivery fee confirmed by seller'}</p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-gray-50 rounded-xl"><Truck size={18} className="mx-auto mb-1 text-gray-600" /><p className="text-xs text-gray-500">{product.free_delivery ? 'Free Delivery' : 'Seller Delivery'}</p></div>
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

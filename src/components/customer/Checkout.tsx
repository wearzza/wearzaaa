import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import { PROVINCES, getDistricts, getMunicipalities } from '../../lib/nepalLocations';
import { ArrowLeft, Check, Tag, MapPin, Phone, User, Truck, Navigation } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSuccess: (orderNumber: string) => void;
}

export default function Checkout({ onBack, onSuccess }: Props) {
  const { items, totalPrice, clearCart } = useCart();
  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    province: '', district: '', municipality: '', ward_number: '', map_url: '',
    promoCode: '', notes: '',
  });
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const grandTotal = Math.max(0, totalPrice - promoDiscount);
  const districts = getDistricts(form.province);
  const municipalities = getMunicipalities(form.province, form.district);

  async function applyPromo() {
    setPromoError('');
    if (!form.promoCode.trim()) return;
    const { data } = await supabase.from('promo_codes').select('*').eq('code', form.promoCode.toUpperCase()).eq('is_active', true).maybeSingle();
    if (!data) { setPromoError('Invalid or expired promo code'); setPromoDiscount(0); setPromoApplied(false); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError('This promo code has expired'); return; }
    setPromoDiscount(Math.round((totalPrice * data.discount_percent) / 100));
    setPromoApplied(true);
  }

  function captureLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setForm(prev => ({ ...prev, map_url: url }));
      },
      () => setForm(prev => ({ ...prev, map_url: '' })),
    );
  }

  async function placeOrder() {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || items.length === 0) return;
    if (!form.province || !form.district || !form.municipality || !form.ward_number) return;
    setSubmitting(true);

    const locationStr = `${form.municipality}-${form.ward_number}, ${form.district}, ${form.province}`;

    const groups = new Map<string, typeof items>();
    items.forEach(item => {
      const arr = groups.get(item.product.seller_id) || [];
      arr.push(item);
      groups.set(item.product.seller_id, arr);
    });

    const orderNumbers: string[] = [];

    for (const [sellerId, sellerItems] of groups) {
      const subtotal = sellerItems.reduce((s, i) => s + i.product.real_price * i.quantity, 0);
      const sellerPromo = promoApplied ? Math.round((subtotal / totalPrice) * promoDiscount) : 0;
      const total = Math.max(0, subtotal - sellerPromo);

      const { data: order } = await supabase.from('orders').insert({
        customer_name: form.name, customer_phone: form.phone, customer_address: form.address, customer_location: locationStr,
        province: form.province, district: form.district, municipality: form.municipality,
        ward_number: form.ward_number ? +form.ward_number : null, map_url: form.map_url || null,
        seller_id: sellerId, promo_code: promoApplied ? form.promoCode.toUpperCase() : null, promo_discount: sellerPromo,
        subtotal, total, payment_method: 'cod', notes: form.notes || null, status: 'pending',
      }).select().single();

      if (order) {
        orderNumbers.push(order.order_number);
        await supabase.from('order_items').insert(sellerItems.map(i => ({
          order_id: order.id, product_id: i.product.id, product_name: i.product.name,
          product_image: i.product.image_urls[0] || null, seller_id: sellerId,
          selected_size: i.selectedSize || null,
          quantity: i.quantity, unit_price: i.product.real_price, total_price: i.product.real_price * i.quantity,
        })));
      }
    }

    clearCart();
    setSubmitting(false);
    onSuccess(orderNumbers.join(', '));
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 mb-4">Your cart is empty</p>
        <button onClick={onBack} className="text-sm font-bold" style={{ color: '#ff3b30' }}>Go back</button>
      </div>
    );
  }

  const locationReady = form.province && form.district && form.municipality && form.ward_number;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-4 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} /> Back to Cart
      </button>

      <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-800">Delivery Information</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><User size={14} /> Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><Phone size={14} /> Phone Number *</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><MapPin size={14} /> Street / House Address *</label>
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} placeholder="House no, street, area, landmark..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none" />
            </div>

            {/* Structured Location */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-3"><MapPin size={16} style={{ color: '#3b82f6' }} /><h3 className="font-bold text-gray-800 text-sm">Delivery Location</h3></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Province *</label>
                  <select value={form.province} onChange={e => setForm({ ...form, province: e.target.value, district: '', municipality: '' })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white">
                    <option value="">Select Province</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">District *</label>
                  <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value, municipality: '' })} disabled={!form.province} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white disabled:bg-gray-100">
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Municipality *</label>
                  <select value={form.municipality} onChange={e => setForm({ ...form, municipality: e.target.value })} disabled={!form.district} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white disabled:bg-gray-100">
                    <option value="">Select Municipality</option>
                    {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Ward Number *</label>
                  <input type="number" value={form.ward_number} onChange={e => setForm({ ...form, ward_number: e.target.value })} min="1" placeholder="e.g. 5" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Google Maps Location</label>
                <div className="flex gap-2">
                  <input type="text" value={form.map_url} onChange={e => setForm({ ...form, map_url: e.target.value })} placeholder="Auto-captured or paste Maps URL" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
                  <button onClick={captureLocation} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap" style={{ background: '#3b82f6' }}><Navigation size={14} /> Capture</button>
                </div>
                {form.map_url && <a href={form.map_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 mt-1 inline-block hover:underline">View on Maps</a>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5">Order Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-1.5"><Tag size={16} /> Promo Code</h2>
            <div className="flex gap-2">
              <input type="text" value={form.promoCode} onChange={e => setForm({ ...form, promoCode: e.target.value })} placeholder="Enter promo code" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 uppercase" />
              <button onClick={applyPromo} className="px-5 py-3 rounded-xl font-bold text-sm text-white" style={{ background: '#1a2340' }}>Apply</button>
            </div>
            {promoError && <p className="text-xs text-red-500 mt-2">{promoError}</p>}
            {promoApplied && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#22c55e' }}><Check size={12} /> Promo applied! You saved Rs. {promoDiscount}</p>}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl p-5 sticky top-24" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-800 mb-3">Order Summary</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map(i => (
                <div key={i.product.id} className="flex gap-2 text-sm">
                  <img src={i.product.image_urls[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 line-clamp-1">{i.product.name}</p>
                    <p className="text-xs text-gray-400">Qty {i.quantity} × Rs. {i.product.real_price}{i.selectedSize ? ` • ${i.selectedSize}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rs. {totalPrice.toLocaleString()}</span></div>
              {promoApplied && <div className="flex justify-between" style={{ color: '#22c55e' }}><span>Discount</span><span>-Rs. {promoDiscount}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="text-xs">By seller</span></div>
              <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100"><span>Total</span><span style={{ color: '#ff3b30' }}>Rs. {grandTotal.toLocaleString()}</span></div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1"><Truck size={16} style={{ color: '#ff3b30' }} /><span className="font-bold text-sm text-gray-800">Cash on Delivery</span></div>
              <p className="text-xs text-gray-500">Pay when you receive your order</p>
            </div>

            <button onClick={placeOrder} disabled={submitting || !form.name.trim() || !form.phone.trim() || !form.address.trim() || !locationReady}
              className="w-full mt-4 py-4 rounded-2xl font-bold text-white text-sm disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ff3b30 0%, #e8251a 100%)' }}>
              {submitting ? 'Placing Order...' : `Place Order • Rs. ${grandTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

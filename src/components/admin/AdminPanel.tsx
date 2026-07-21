import { useEffect, useState } from 'react';
import { supabase, Seller, Order, PromoCode, Banner } from '../../lib/supabase';
import { Shield, Store, ShoppingBag, Tag, BarChart3, Bell, LogOut, Check, X, Ban, TrendingUp, Package, Image, Plus, Edit, Trash2, Upload } from 'lucide-react';

type Tab = 'analytics' | 'sellers' | 'orders' | 'promos' | 'banners' | 'notifications';

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('analytics');

  const nav: { id: Tab; label: string; icon: any }[] = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'sellers', label: 'Sellers', icon: Store },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'promos', label: 'Promo Codes', icon: Tag },
    { id: 'banners', label: 'Banners', icon: Image },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="md:w-64 bg-white md:min-h-screen border-b md:border-b-0 md:border-r border-gray-100 flex-shrink-0">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a2340, #2a3360)' }}><Shield size={16} className="text-white" /></div>
            <span className="font-black text-gray-900">Wearza Admin</span>
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            {nav.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors" style={{ background: tab === item.id ? '#1a2340' : 'transparent', color: tab === item.id ? 'white' : '#4b5563' }}>
                <item.icon size={16} /> {item.label}
              </button>
            ))}
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors whitespace-nowrap"><LogOut size={16} /> Logout</button>
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'sellers' && <SellersTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'promos' && <PromosTab />}
        {tab === 'banners' && <BannersTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </main>
    </div>
  );
}

function AnalyticsTab() {
  const [stats, setStats] = useState({ sellers: 0, pendingSellers: 0, orders: 0, revenue: 0, products: 0 });
  const [recent, setRecent] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      const [s, p, o, pr, r] = await Promise.all([
        supabase.from('sellers').select('id', { count: 'exact' }),
        supabase.from('sellers').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('orders').select('total, status'),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('*, sellers!inner(business_name), order_items(*)').order('created_at', { ascending: false }).limit(5),
      ]);
      const orders = o.data || [];
      setStats({ sellers: s.count || 0, pendingSellers: p.count || 0, orders: orders.length, revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0), products: pr.count || 0 });
      setRecent(r.data || []);
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Sellers', value: stats.sellers, color: '#3b82f6', icon: Store, sub: `${stats.pendingSellers} pending` },
    { label: 'Total Orders', value: stats.orders, color: '#8b5cf6', icon: ShoppingBag, sub: 'all time' },
    { label: 'Total Products', value: stats.products, color: '#ec4899', icon: Package, sub: 'listed' },
    { label: 'Revenue (Delivered)', value: `Rs. ${stats.revenue.toLocaleString()}`, color: '#22c55e', icon: TrendingUp, sub: 'commission: 25%' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Analytics Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.color + '15' }}><c.icon size={18} style={{ color: c.color }} /></div></div>
            <p className="text-2xl font-black text-gray-900">{c.value}</p><p className="text-xs text-gray-400 mt-1">{c.label}</p><p className="text-xs mt-0.5" style={{ color: c.color }}>{c.sub}</p>
          </div>
        ))}
      </div>
      <h2 className="font-bold text-gray-800 mb-3">Recent Orders</h2>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        {recent.length === 0 ? <p className="text-center py-8 text-gray-400 text-sm">No orders yet</p> : (
          <div className="divide-y divide-gray-50">
            {recent.map(o => (
              <div key={o.id} className="p-4 flex items-center justify-between">
                <div><p className="text-xs text-gray-400">#{o.order_number}</p><p className="text-sm font-bold text-gray-800">{o.customer_name}</p><p className="text-xs text-gray-400">{(o as any).sellers?.business_name}</p></div>
                <div className="text-right"><p className="font-black text-sm" style={{ color: '#ff3b30' }}>Rs. {o.total.toLocaleString()}</p><span className="text-xs text-gray-400">{o.status}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SellersTab() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  async function load() { const { data } = await supabase.from('sellers').select('*').order('created_at', { ascending: false }); setSellers(data || []); }
  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) { await supabase.from('sellers').update({ status, updated_at: new Date().toISOString() }).eq('id', id); load(); if (selectedSeller?.id === id) setSelectedSeller(prev => prev ? { ...prev, status: status as any } : null); }

  const filtered = filter === 'all' ? sellers : sellers.filter(s => s.status === filter);
  const colors: Record<string, string> = { pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444', banned: '#6b7280' };

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Seller Management</h1>
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {['all', 'pending', 'approved', 'rejected', 'banned'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors capitalize" style={{ background: filter === f ? '#1a2340' : 'white', color: filter === f ? 'white' : '#4b5563', border: filter === f ? 'none' : '1px solid #e5e7eb' }}>{f}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div className="flex flex-wrap items-start gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {s.shop_logo_url ? <img src={s.shop_logo_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-gray-300">{s.business_name[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-800">{s.business_name}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: colors[s.status] + '15', color: colors[s.status] }}>{s.status}</span>
                </div>
                <p className="text-sm text-gray-500">{s.full_name} • {s.email}</p>
                <p className="text-xs text-gray-400 mt-1">{s.phone} • {s.shop_location}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setSelectedSeller(s)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:border-blue-400 transition-colors">View Details</button>
                {s.status === 'pending' && (<>
                  <button onClick={() => updateStatus(s.id, 'approved')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#22c55e' }}><Check size={12} /> Approve</button>
                  <button onClick={() => updateStatus(s.id, 'rejected')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#ef4444' }}><X size={12} /> Reject</button>
                </>)}
                {s.status === 'approved' && <button onClick={() => updateStatus(s.id, 'banned')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-500 transition-colors"><Ban size={12} /> Ban</button>}
                {(s.status === 'rejected' || s.status === 'banned') && <button onClick={() => updateStatus(s.id, 'approved')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#22c55e' }}><Check size={12} /> Reinstate</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seller Detail Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSeller(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Seller Details</h2>
              <button onClick={() => setSelectedSeller(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500" /></button>
            </div>

            {/* Status banner */}
            <div className="p-3 rounded-xl mb-5 flex items-center justify-between" style={{ background: colors[selectedSeller.status] + '15' }}>
              <span className="font-bold text-sm" style={{ color: colors[selectedSeller.status] }}>Status: {selectedSeller.status}</span>
              <div className="flex gap-2">
                {selectedSeller.status !== 'approved' && <button onClick={() => updateStatus(selectedSeller.id, 'approved')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#22c55e' }}>Approve</button>}
                {selectedSeller.status !== 'rejected' && <button onClick={() => updateStatus(selectedSeller.id, 'rejected')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#ef4444' }}>Reject</button>}
                {selectedSeller.status !== 'banned' && <button onClick={() => updateStatus(selectedSeller.id, 'banned')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#6b7280' }}>Ban</button>}
              </div>
            </div>

            {/* Personal & Business Info */}
            <div className="mb-5">
              <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b border-gray-100">Personal & Business</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Full Name</p><p className="font-medium text-gray-700">{selectedSeller.full_name}</p></div>
                <div><p className="text-xs text-gray-400">Business Name</p><p className="font-medium text-gray-700">{selectedSeller.business_name}</p></div>
                <div><p className="text-xs text-gray-400">Email</p><p className="font-medium text-gray-700">{selectedSeller.email}</p></div>
                <div><p className="text-xs text-gray-400">Phone</p><p className="font-medium text-gray-700">{selectedSeller.phone}</p></div>
                {selectedSeller.instagram && <div><p className="text-xs text-gray-400">Instagram</p><p className="font-medium text-gray-700">{selectedSeller.instagram}</p></div>}
                {selectedSeller.tiktok && <div><p className="text-xs text-gray-400">TikTok</p><p className="font-medium text-gray-700">{selectedSeller.tiktok}</p></div>}
                {selectedSeller.shop_description && <div className="col-span-2"><p className="text-xs text-gray-400">Description</p><p className="font-medium text-gray-700">{selectedSeller.shop_description}</p></div>}
              </div>
            </div>

            {/* Location */}
            <div className="mb-5">
              <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b border-gray-100">Location</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Province</p><p className="font-medium text-gray-700">{selectedSeller.province || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-400">District</p><p className="font-medium text-gray-700">{selectedSeller.district || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-400">Municipality</p><p className="font-medium text-gray-700">{selectedSeller.municipality || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-400">Ward Number</p><p className="font-medium text-gray-700">{selectedSeller.ward_number || 'N/A'}</p></div>
                {selectedSeller.map_url && <div className="col-span-2"><p className="text-xs text-gray-400">Google Maps</p><a href={selectedSeller.map_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline">View on Maps</a></div>}
              </div>
            </div>

            {/* Verification Images */}
            <div className="mb-5">
              <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b border-gray-100">Verification & Documents</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Face Verification', url: selectedSeller.face_image_url },
                  { label: 'Citizenship Front', url: selectedSeller.citizenship_front_url },
                  { label: 'Citizenship Back', url: selectedSeller.citizenship_back_url },
                  { label: 'Shop Registration', url: selectedSeller.shop_registration_url },
                  { label: 'PAN/VAT Certificate', url: selectedSeller.pan_vat_url },
                  { label: 'Business License', url: selectedSeller.business_license_url },
                ].map((doc, i) => (
                  <div key={i}>
                    <p className="text-xs text-gray-400 mb-1">{doc.label}{doc.label.includes('Shop') || doc.label.includes('PAN') ? ' *' : ''}</p>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"><img src={doc.url} alt={doc.label} className="w-full h-24 rounded-xl object-cover border border-gray-100 hover:opacity-80 transition-opacity" /></a>
                    ) : (
                      <div className="w-full h-24 rounded-xl bg-gray-50 flex items-center justify-center text-xs text-gray-300">Not provided</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Agreement Status */}
            <div className="mb-2">
              <h3 className="font-bold text-sm text-gray-800 mb-2 pb-1 border-b border-gray-100">Agreements</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2"><span className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedSeller.terms_business_agreed ? 'bg-green-100' : 'bg-gray-100'}`}><Check size={12} className={selectedSeller.terms_business_agreed ? 'text-green-600' : 'text-gray-300'} /></span><span className="text-gray-600">Business Agreement {selectedSeller.terms_business_agreed ? 'accepted' : 'not accepted'}</span></div>
                <div className="flex items-center gap-2"><span className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedSeller.terms_legal_agreed ? 'bg-green-100' : 'bg-gray-100'}`}><Check size={12} className={selectedSeller.terms_legal_agreed ? 'text-green-600' : 'text-gray-300'} /></span><span className="text-gray-600">Legal & Identity Agreement {selectedSeller.terms_legal_agreed ? 'accepted' : 'not accepted'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('orders').select('*, sellers!inner(business_name), order_items(*)').order('created_at', { ascending: false }).limit(100);
      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const colors: Record<string, string> = { pending: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#22c55e', cancelled: '#ef4444' };

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">All Orders (Global)</h1>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}><ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" /><p className="text-gray-500 font-medium">No orders yet</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div><p className="text-xs text-gray-400">#{o.order_number}</p><p className="font-bold text-gray-800 text-sm">{o.customer_name} • {o.customer_phone}</p><p className="text-xs text-gray-400">{o.customer_address}, {o.customer_location}</p></div>
                <div className="text-right"><span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: colors[o.status] + '15', color: colors[o.status] }}>{o.status}</span><p className="text-xs text-gray-400 mt-1">{(o as any).sellers?.business_name}</p></div>
              </div>
              <div className="space-y-1 mb-2">
                {o.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <img src={item.product_image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="flex-1 line-clamp-1 text-gray-700">{item.product_name}</span>
                    <span className="text-gray-400 text-xs">×{item.quantity}</span>
                    <span className="font-bold text-gray-700">Rs. {item.total_price}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</span>
                <span className="font-black" style={{ color: '#ff3b30' }}>Rs. {o.total.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromosTab() {
  const [promos, setPromos] = useState<PromoCode[]>([]);

  async function load() { const { data } = await supabase.from('promo_codes').select('*, sellers!left(business_name)').order('created_at', { ascending: false }); setPromos(data || []); }
  useEffect(() => { load(); }, []);

  async function toggle(id: string, active: boolean) { await supabase.from('promo_codes').update({ is_active: !active }).eq('id', id); load(); }

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">All Promo Codes</h1>
      {promos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}><Tag size={48} className="mx-auto text-gray-200 mb-4" /><p className="text-gray-500 font-medium">No promo codes created</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-2"><span className="text-lg font-black" style={{ color: '#ff3b30' }}>{p.code}</span><span className={`text-xs font-bold px-2 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{p.is_active ? 'Active' : 'Disabled'}</span></div>
              <p className="text-sm text-gray-600">{p.discount_percent}% off</p>
              <p className="text-xs text-gray-400 mt-1">By: {(p as any).sellers?.business_name || 'Unknown'}</p>
              <p className="text-xs text-gray-400">Used {p.usage_count} times</p>
              <button onClick={() => toggle(p.id, p.is_active)} className="w-full mt-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:border-red-400 transition-colors">{p.is_active ? 'Disable' : 'Enable'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsTab() {
  const [sellers, setSellers] = useState<{ id: string; business_name: string }[]>([]);
  const [form, setForm] = useState({ title: '', message: '', seller_id: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.from('sellers').select('id, business_name').eq('status', 'approved').then(({ data }) => setSellers(data || []));
  }, []);

  async function send() {
    if (!form.title || !form.message) return;
    if (form.seller_id === 'all') {
      await supabase.from('notifications').insert(sellers.map(s => ({ title: form.title, message: form.message, seller_id: s.id })));
    } else {
      await supabase.from('notifications').insert({ title: form.title, message: form.message, seller_id: form.seller_id || null });
    }
    setForm({ title: '', message: '', seller_id: '' });
    setSent(true); setTimeout(() => setSent(false), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Send Notifications</h1>
      <div className="bg-white rounded-2xl p-6 max-w-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Recipient</label>
            <select value={form.seller_id} onChange={e => setForm({ ...form, seller_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white">
              <option value="">Select recipient</option>
              <option value="all">All Sellers</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
            </select>
          </div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none" /></div>
          <button onClick={send} disabled={!form.title || !form.message || !form.seller_id} className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #1a2340, #2a3360)' }}>{sent ? 'Sent!' : 'Send Notification'}</button>
        </div>
      </div>
    </div>
  );
}

function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', button_text: 'Shop Now', button_link: 'women', image_url: '', is_active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
    setBanners(data || []);
  }
  useEffect(() => { load(); }, []);

  function reset() { setForm({ title: '', subtitle: '', button_text: 'Shop Now', button_link: 'women', image_url: '', is_active: true, sort_order: 0 }); setEditing(null); }

  function startEdit(b: Banner) {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle || '', button_text: b.button_text, button_link: b.button_link, image_url: b.image_url || '', is_active: b.is_active, sort_order: b.sort_order });
    setShowForm(true);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, image_url: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!form.title) return;
    setSaving(true);
    const payload = {
      title: form.title, subtitle: form.subtitle || null, button_text: form.button_text,
      button_link: form.button_link, image_url: form.image_url || null,
      is_active: form.is_active, sort_order: form.sort_order, updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('banners').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('banners').insert(payload);
    }
    // If this banner is active, deactivate others
    if (form.is_active) {
      const targetId = editing?.id;
      if (targetId) {
        await supabase.from('banners').update({ is_active: false }).neq('id', targetId);
      } else {
        // Deactivate all existing (new banner will be the only active one)
        await supabase.from('banners').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }
    }
    setShowForm(false); reset(); setSaving(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    load();
  }

  async function toggleActive(b: Banner) {
    if (!b.is_active) {
      // Activating this banner - deactivate all others
      await supabase.from('banners').update({ is_active: false }).neq('id', b.id);
    }
    await supabase.from('banners').update({ is_active: !b.is_active, updated_at: new Date().toISOString() }).eq('id', b.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Homepage Banners</h1>
        <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #1a2340, #2a3360)' }}><Plus size={16} /> Add Banner</button>
      </div>

      <p className="text-sm text-gray-500 mb-4">Only one banner can be active at a time. The active banner appears on the customer homepage instantly.</p>

      {banners.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <Image size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">No banners yet</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-bold" style={{ color: '#1a2340' }}>Create your first banner</button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="relative h-32 sm:h-40 bg-gray-100" style={b.image_url ? { backgroundImage: `url(${b.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, #1a2340, #ff3b30)' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.6), transparent)' }} />
                <div className="absolute inset-0 p-4 flex flex-col justify-center">
                  <h3 className="text-white font-black text-lg sm:text-xl">{b.title}</h3>
                  <p className="text-white/80 text-xs sm:text-sm line-clamp-1">{b.subtitle}</p>
                  <span className="mt-2 inline-block w-fit bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">{b.button_text}</span>
                </div>
                <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${b.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>{b.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">Order: {b.sort_order} • Links to: {b.button_link}</span>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(b)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:border-green-400 transition-colors">{b.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => startEdit(b)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 hover:border-blue-400 transition-colors"><Edit size={14} className="text-gray-600" /></button>
                  <button onClick={() => del(b.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-200 hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-red-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editing ? 'Edit Banner' : 'Add Banner'}</h2>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Fashion that fits your style" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Subtitle</label><input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Shop from verified fashion stores..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Button Text</label><input value={form.button_text} onChange={e => setForm({ ...form, button_text: e.target.value })} placeholder="Shop Now" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Button Link (category)</label>
                  <select value={form.button_link} onChange={e => setForm({ ...form, button_link: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white">
                    <option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option>
                    <option value="streetwear">Streetwear</option><option value="old_money">Old Money</option><option value="budget">Budget Deals</option>
                  </select>
                </div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Sort Order</label><input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: +e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Banner Image</label>
                {form.image_url && <img src={form.image_url} alt="" className="w-full h-32 rounded-xl object-cover mb-2" />}
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors"><Upload size={16} className="text-gray-400" /><span className="text-sm text-gray-500">{form.image_url ? 'Change image' : 'Upload banner image'}</span><input type="file" accept="image/*" className="hidden" onChange={handleUpload} /></label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">Set as active banner (deactivates others)</span>
              </label>
              <button onClick={save} disabled={saving || !form.title} className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #1a2340, #2a3360)' }}>{saving ? 'Saving...' : editing ? 'Update Banner' : 'Create Banner'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

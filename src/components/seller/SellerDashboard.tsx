import { useEffect, useState } from 'react';
import { supabase, Product, Order, PromoCode, Review, ProductCategory, Seller } from '../../lib/supabase';
import { useSeller } from '../../contexts/SellerContext';
import { hashPassword } from '../../lib/auth';
import { Store, Package, ShoppingBag, Tag, Star, Settings, LogOut, Plus, Edit, Trash2, Upload, X, Clock, CheckCircle, Bell } from 'lucide-react';

type Tab = 'overview' | 'products' | 'orders' | 'promos' | 'reviews' | 'notifications' | 'branding' | 'settings';

export default function SellerDashboard() {
  const { seller, logout } = useSeller();
  const [tab, setTab] = useState<Tab>('overview');

  if (!seller) return null;

  if (seller.status !== 'approved') {
    const statusMsg = seller.status === 'pending' ? 'Your account is under review by admin' : seller.status === 'rejected' ? 'Your application was rejected' : 'Your account has been banned';
    const statusColor = seller.status === 'pending' ? '#f59e0b' : '#ef4444';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ background: statusColor + '15' }}>
            <Clock size={40} style={{ color: statusColor }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Account Under Review</h1>
          <p className="text-gray-500 mb-1">{statusMsg}</p>
          <p className="text-sm text-gray-400 mb-8">You will be able to access seller features once admin approves your account. Please check back later.</p>
          <button onClick={logout} className="px-6 py-3 rounded-xl font-bold text-sm text-white" style={{ background: '#ff3b30' }}>Logout</button>
        </div>
      </div>
    );
  }

  const nav: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Store },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'promos', label: 'Promo Codes', icon: Tag },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'branding', label: 'Branding', icon: Store },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="md:w-64 bg-white md:min-h-screen border-b md:border-b-0 md:border-r border-gray-100 flex-shrink-0">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-6"><img src="/assets/images/f5843efc-6c3d-47ff-b16f-26605943a43c.png" alt="Wearza" className="h-7 object-contain" /></div>
          <div className="p-3 bg-gray-50 rounded-2xl mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                {seller.shop_logo_url ? <img src={seller.shop_logo_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-gray-400">{seller.business_name[0]}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{seller.business_name}</p>
                <span className="text-xs" style={{ color: seller.status === 'approved' ? '#22c55e' : '#f59e0b' }}>{seller.status === 'approved' ? 'Verified' : 'Pending'}</span>
              </div>
            </div>
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            {nav.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors" style={{ background: tab === item.id ? '#ff3b30' : 'transparent', color: tab === item.id ? 'white' : '#4b5563' }}>
                <item.icon size={16} /> {item.label}
              </button>
            ))}
            <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors whitespace-nowrap"><LogOut size={16} /> Logout</button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {tab === 'overview' && <OverviewTab seller={seller} setTab={setTab} />}
        {tab === 'products' && <ProductsTab seller={seller} />}
        {tab === 'orders' && <OrdersTab seller={seller} />}
        {tab === 'promos' && <PromosTab seller={seller} />}
        {tab === 'reviews' && <ReviewsTab seller={seller} />}
        {tab === 'notifications' && <NotificationsTab seller={seller} />}
        {tab === 'branding' && <BrandingTab seller={seller} />}
        {tab === 'settings' && <SettingsTab seller={seller} />}
      </main>
    </div>
  );
}

function OverviewTab({ seller, setTab }: { seller: Seller; setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });

  useEffect(() => {
    async function load() {
      const [p, o] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('seller_id', seller.id),
        supabase.from('orders').select('total, status').eq('seller_id', seller.id),
      ]);
      const orders = o.data || [];
      setStats({ products: p.count || 0, orders: orders.length, revenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0), pending: orders.filter(o => o.status === 'pending').length });
    }
    load();
  }, [seller.id]);

  const cards = [
    { label: 'Total Products', value: stats.products, color: '#3b82f6', icon: Package },
    { label: 'Total Orders', value: stats.orders, color: '#8b5cf6', icon: ShoppingBag },
    { label: 'Pending Orders', value: stats.pending, color: '#f59e0b', icon: Clock },
    { label: 'Revenue (Delivered)', value: `Rs. ${stats.revenue.toLocaleString()}`, color: '#22c55e', icon: CheckCircle },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Welcome, {seller.full_name}!</h1>
      {seller.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Clock size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div><p className="font-bold text-yellow-800 text-sm">Account Pending Approval</p><p className="text-xs text-yellow-700 mt-1">Your seller account is awaiting admin approval. You can add products but they won't be visible to customers until approved.</p></div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.color + '15' }}><c.icon size={18} style={{ color: c.color }} /></div>
            <p className="text-2xl font-black text-gray-900">{c.value}</p><p className="text-xs text-gray-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <button onClick={() => setTab('products')} className="bg-white rounded-2xl p-6 text-left hover:shadow-lg transition-all" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <Package size={24} style={{ color: '#ff3b30' }} /><p className="font-bold text-gray-800 mt-2">Manage Products</p><p className="text-sm text-gray-400">Add, edit, or delete your products</p>
        </button>
        <button onClick={() => setTab('orders')} className="bg-white rounded-2xl p-6 text-left hover:shadow-lg transition-all" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <ShoppingBag size={24} style={{ color: '#ff3b30' }} /><p className="font-bold text-gray-800 mt-2">View Orders</p><p className="text-sm text-gray-400">Track and update order status</p>
        </button>
      </div>
    </div>
  );
}

function ProductsTab({ seller }: { seller: Seller }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', categories: [] as ProductCategory[], real_price: '', cut_price: '', stock: '1', video_url: '' });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoData, setVideoData] = useState<string>('');
  const [videoName, setVideoName] = useState<string>('');

  const ALL_CATS: { id: ProductCategory; label: string }[] = [
    { id: 'men', label: 'Men' }, { id: 'women', label: 'Women' }, { id: 'kids', label: 'Kids' },
    { id: 'streetwear', label: 'Streetwear' }, { id: 'old_money', label: 'Old Money' }, { id: 'budget', label: 'Budget Deals' },
  ];

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [seller.id]);

  function reset() { setForm({ name: '', description: '', categories: [], real_price: '', cut_price: '', stock: '1', video_url: '' }); setImageUrls([]); setVideoData(''); setVideoName(''); setEditing(null); }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setImageUrls(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert('Video must be under 15MB'); return; }
    setVideoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setVideoData(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleCategory(cat: ProductCategory) {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat],
    }));
  }

  async function save() {
    if (!form.name || !form.real_price || form.categories.length === 0) return;
    const primaryCat = form.categories[0];
    const payload = {
      seller_id: seller.id, name: form.name, description: form.description || null, category: primaryCat,
      categories: form.categories,
      real_price: +form.real_price, cut_price: form.cut_price ? +form.cut_price : null, stock: +form.stock || 1,
      image_urls: imageUrls, video_url: form.video_url || null, video_data: videoData || null, is_active: true,
    };
    if (editing) await supabase.from('products').update(payload).eq('id', editing.id);
    else await supabase.from('products').insert(payload);
    setShowForm(false); reset(); load();
  }

  async function del(id: string) { if (!confirm('Delete this product?')) return; await supabase.from('products').delete().eq('id', id); load(); }

  function startEdit(p: Product) {
    setEditing(p);
    const cats = (p.categories && p.categories.length > 0) ? p.categories : [p.category];
    setForm({ name: p.name, description: p.description || '', categories: cats as ProductCategory[], real_price: String(p.real_price), cut_price: p.cut_price ? String(p.cut_price) : '', stock: String(p.stock), video_url: p.video_url || '' });
    setImageUrls(p.image_urls || []);
    setVideoData(p.video_data || '');
    setVideoName(p.video_data ? 'Current video' : '');
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Products</h1>
        <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}><Plus size={16} /> Add Product</button>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <Package size={48} className="mx-auto text-gray-200 mb-4" /><p className="text-gray-500 font-medium">No products yet</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-bold" style={{ color: '#ff3b30' }}>Add your first product</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="relative bg-gray-50" style={{ paddingBottom: '60%' }}>
                <img src={p.image_urls[0]} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => startEdit(p)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform"><Edit size={14} className="text-gray-600" /></button>
                  <button onClick={() => del(p.id)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform"><Trash2 size={14} className="text-red-500" /></button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{p.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(p.categories && p.categories.length > 0 ? p.categories : [p.category]).map((c: string) => (
                    <span key={c} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{c.replace('_', ' ')}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2"><span className="font-black" style={{ color: '#ff3b30' }}>Rs. {p.real_price.toLocaleString()}</span><span className="text-xs text-gray-400">Stock: {p.stock}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Product' : 'Add Product'}</h2><button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Product Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none" /></div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Categories * (select one or more)</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATS.map(c => (
                    <button key={c.id} type="button" onClick={() => toggleCategory(c.id)} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize"
                      style={{ background: form.categories.includes(c.id) ? '#ff3b30' : '#f3f4f6', color: form.categories.includes(c.id) ? 'white' : '#6b7280' }}>
                      {c.label.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Real Price (Rs.) *</label><input type="number" value={form.real_price} onChange={e => setForm({ ...form, real_price: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Cut Price (Rs.)</label><input type="number" value={form.cut_price} onChange={e => setForm({ ...form, cut_price: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Stock</label><input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Product Images</label>
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors"><Upload size={16} className="text-gray-400" /><span className="text-sm text-gray-500">Upload images</span><input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} /></label>
                {imageUrls.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        <button onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Product Video (upload from device)</label>
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors"><Upload size={16} className="text-gray-400" /><span className="text-sm text-gray-500">{videoName || 'Upload video (mp4, max 15MB)'}</span><input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} /></label>
                {videoData && (
                  <div className="mt-2">
                    <video src={videoData} controls className="w-full max-h-40 rounded-xl" />
                    <button onClick={() => { setVideoData(''); setVideoName(''); }} className="text-xs text-red-500 mt-1">Remove video</button>
                  </div>
                )}
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Video URL (optional)</label><input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              <button onClick={save} disabled={!form.name || !form.real_price || form.categories.length === 0} className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>{editing ? 'Update Product' : 'Add Product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersTab({ seller }: { seller: Seller }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*, order_items(*)').eq('seller_id', seller.id).order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [seller.id]);

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    load();
    if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
  }

  const colors: Record<string, string> = { pending: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#22c55e', cancelled: '#ef4444' };

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Orders</h1>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}><ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" /><p className="text-gray-500 font-medium">No orders yet</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div><p className="text-xs text-gray-400">#{o.order_number}</p><p className="font-bold text-gray-800 text-sm">{o.customer_name} • {o.customer_phone}</p><p className="text-xs text-gray-400">{o.customer_address}, {o.customer_location}</p></div>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: colors[o.status] + '15', color: colors[o.status] }}>{o.status}</span>
              </div>
              <div className="space-y-1 mb-3">
                {o.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <img src={item.product_image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="flex-1 line-clamp-1 text-gray-700">{item.product_name}</span>
                    {item.selectedSize && <span className="text-xs text-gray-400">Size: {item.selectedSize}</span>}
                    <span className="text-gray-400 text-xs">×{item.quantity}</span>
                    <span className="font-bold text-gray-700">Rs. {item.total_price}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="font-black" style={{ color: '#ff3b30' }}>Rs. {o.total.toLocaleString()}</span>
                  <button onClick={() => setSelectedOrder(o)} className="text-xs font-bold border border-gray-200 px-3 py-1.5 rounded-lg hover:border-blue-400 transition-colors">View Details</button>
                </div>
                <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:outline-none focus:border-red-400 bg-white">
                  <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
              {o.status === 'delivered' && !o.commission_paid && (
                <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700">Remember to pay 25% commission (Rs. {Math.round(o.total * 0.25)}) to eSewa: 9807470285</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500" /></button>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div><p className="text-xs text-gray-400">Order #</p><p className="font-bold text-gray-800">{selectedOrder.order_number}</p></div>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: colors[selectedOrder.status] + '15', color: colors[selectedOrder.status] }}>{selectedOrder.status}</span>
            </div>

            <div className="mb-4 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-400">Name:</span> <span className="font-medium text-gray-700">{selectedOrder.customer_name}</span></p>
                <p><span className="text-gray-400">Phone:</span> <span className="font-medium text-gray-700">{selectedOrder.customer_phone}</span></p>
                <p><span className="text-gray-400">Address:</span> <span className="font-medium text-gray-700">{selectedOrder.customer_address}</span></p>
              </div>
            </div>

            <div className="mb-4 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Delivery Location</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-400">Province:</span> <span className="font-medium text-gray-700">{selectedOrder.province || 'N/A'}</span></p>
                <p><span className="text-gray-400">District:</span> <span className="font-medium text-gray-700">{selectedOrder.district || 'N/A'}</span></p>
                <p><span className="text-gray-400">Municipality:</span> <span className="font-medium text-gray-700">{selectedOrder.municipality || 'N/A'}</span></p>
                <p><span className="text-gray-400">Ward:</span> <span className="font-medium text-gray-700">{selectedOrder.ward_number || 'N/A'}</span></p>
                {selectedOrder.map_url && <a href={selectedOrder.map_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-blue-500 text-xs hover:underline">View on Google Maps</a>}
              </div>
            </div>

            <div className="mb-4 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Products</h3>
              <div className="space-y-2">
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <img src={item.product_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 line-clamp-1">{item.product_name}</p>
                      <p className="text-xs text-gray-400">Qty {item.quantity}{item.selectedSize ? ` • Size: ${item.selectedSize}` : ''}</p>
                    </div>
                    <span className="font-bold text-gray-700">Rs. {item.total_price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Payment</h3>
              <div className="space-y-1 text-sm">
                <p className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="font-medium">Rs. {selectedOrder.subtotal.toLocaleString()}</span></p>
                {selectedOrder.promo_discount > 0 && <p className="flex justify-between" style={{ color: '#22c55e' }}><span>Discount ({selectedOrder.promo_code})</span><span>-Rs. {selectedOrder.promo_discount}</span></p>}
                <p className="flex justify-between font-black text-base pt-1"><span>Total</span><span style={{ color: '#ff3b30' }}>Rs. {selectedOrder.total.toLocaleString()}</span></p>
                <p className="text-xs text-gray-400 mt-1">Cash on Delivery</p>
              </div>
            </div>

            {selectedOrder.notes && <div className="mb-4"><h3 className="font-bold text-sm text-gray-800 mb-1">Notes</h3><p className="text-sm text-gray-600">{selectedOrder.notes}</p></div>}

            <div>
              <h3 className="font-bold text-sm text-gray-800 mb-2">Update Status</h3>
              <select value={selectedOrder.status} onChange={e => updateStatus(selectedOrder.id, e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-red-400 bg-white">
                <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromosTab({ seller }: { seller: Seller }) {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_percent: '10' });

  async function load() { const { data } = await supabase.from('promo_codes').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }); setPromos(data || []); }
  useEffect(() => { load(); }, [seller.id]);

  async function create() {
    if (!form.code) return;
    await supabase.from('promo_codes').insert({ code: form.code.toUpperCase(), discount_percent: +form.discount_percent, seller_id: seller.id, is_active: true });
    setForm({ code: '', discount_percent: '10' }); setShowForm(false); load();
  }
  async function toggle(id: string, active: boolean) { await supabase.from('promo_codes').update({ is_active: !active }).eq('id', id); load(); }
  async function del(id: string) { if (!confirm('Delete this promo code?')) return; await supabase.from('promo_codes').delete().eq('id', id); load(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Promo Codes</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}><Plus size={16} /> Create</button>
      </div>
      {promos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}><Tag size={48} className="mx-auto text-gray-200 mb-4" /><p className="text-gray-500 font-medium">No promo codes yet</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-2"><span className="text-lg font-black" style={{ color: '#ff3b30' }}>{p.code}</span><span className={`text-xs font-bold px-2 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></div>
              <p className="text-sm text-gray-600">{p.discount_percent}% off</p><p className="text-xs text-gray-400 mt-1">Used {p.usage_count} times</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggle(p.id, p.is_active)} className="flex-1 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:border-red-400 transition-colors">{p.is_active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => del(p.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Create Promo Code</h2>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Code</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER25" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 uppercase" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Discount (%)</label><input type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} min="1" max="100" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              <button onClick={create} className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsTab({ seller }: { seller: Seller }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('reviews').select('*, products!inner(name)').eq('seller_id', seller.id).order('created_at', { ascending: false });
      setReviews(data || []);
      setLoading(false);
    }
    load();
  }, [seller.id]);

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Customer Reviews</h1>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : reviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}><Star size={48} className="mx-auto text-gray-200 mb-4" /><p className="text-gray-500 font-medium">No reviews yet</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-2">
                <div><p className="font-bold text-gray-800 text-sm">{r.reviewer_name}</p>
                  <div className="flex gap-0.5 mt-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < r.rating ? '#f59e0b' : 'none'} stroke={i < r.rating ? '#f59e0b' : '#d1d5db'} />)}</div>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600">{r.comment}</p>
              {(r as any).products?.name && <p className="text-xs text-gray-400 mt-2">on: {(r as any).products.name}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsTab({ seller }: { seller: Seller }) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('notifications').select('*').or(`seller_id.eq.${seller.id},seller_id.is.null`).order('created_at', { ascending: false });
      setNotifications(data || []);
    }
    load();
  }, [seller.id]);

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Notifications</h1>
      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}><Bell size={48} className="mx-auto text-gray-200 mb-4" /><p className="text-gray-500 font-medium">No notifications</p></div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ff3b3015' }}><Bell size={16} style={{ color: '#ff3b30' }} /></div>
                <div className="flex-1"><p className="font-bold text-gray-800 text-sm">{n.title}</p><p className="text-sm text-gray-600 mt-1">{n.message}</p><p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BrandingTab({ seller }: { seller: Seller }) {
  const [form, setForm] = useState({
    business_name: seller.business_name, shop_description: seller.shop_description || '',
    shop_location: seller.shop_location, shop_logo_url: seller.shop_logo_url || '', shop_banner_url: '',
    instagram: seller.instagram || '', tiktok: seller.tiktok || '',
  });
  const [saved, setSaved] = useState(false);

  function handleUpload(field: 'shop_logo_url' | 'shop_banner_url', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, [field]: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function save() {
    await supabase.from('sellers').update({
      business_name: form.business_name, shop_description: form.shop_description, shop_location: form.shop_location,
      shop_logo_url: form.shop_logo_url, shop_banner_url: form.shop_banner_url, instagram: form.instagram, tiktok: form.tiktok,
      updated_at: new Date().toISOString(),
    }).eq('id', seller.id);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Branding</h1>
      <div className="bg-white rounded-2xl p-6 max-w-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Business Name</label><input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Shop Description</label><textarea value={form.shop_description} onChange={e => setForm({ ...form, shop_description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none" /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Shop Location</label><input value={form.shop_location} onChange={e => setForm({ ...form, shop_location: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Instagram</label><input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">TikTok</label><input value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Shop Logo</label>
            {form.shop_logo_url && <img src={form.shop_logo_url} alt="" className="w-20 h-20 rounded-xl object-cover mb-2" />}
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors"><Upload size={16} className="text-gray-400" /><span className="text-sm text-gray-500">Upload logo</span><input type="file" accept="image/*" className="hidden" onChange={e => handleUpload('shop_logo_url', e)} /></label>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Shop Banner</label>
            {form.shop_banner_url && <img src={form.shop_banner_url} alt="" className="w-full h-32 rounded-xl object-cover mb-2" />}
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors"><Upload size={16} className="text-gray-400" /><span className="text-sm text-gray-500">Upload banner</span><input type="file" accept="image/*" className="hidden" onChange={e => handleUpload('shop_banner_url', e)} /></label>
          </div>
          <button onClick={save} className="w-full py-3.5 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>{saved ? 'Saved!' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ seller }: { seller: Seller }) {
  const [form, setForm] = useState({ full_name: seller.full_name, phone: seller.phone, email: seller.email, password: '' });
  const [saved, setSaved] = useState(false);

  async function save() {
    const update: any = { full_name: form.full_name, phone: form.phone, email: form.email, updated_at: new Date().toISOString() };
    if (form.password) update.password_hash = hashPassword(form.password);
    await supabase.from('sellers').update(update).eq('id', seller.id);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Settings</h1>
      <div className="bg-white rounded-2xl p-6 max-w-2xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">New Password (leave blank to keep)</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
          <button onClick={save} className="w-full py-3.5 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>{saved ? 'Saved!' : 'Update Settings'}</button>
        </div>
      </div>
    </div>
  );
}

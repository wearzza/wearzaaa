import { useEffect, useState } from 'react';
import { Ban, Eye, Package, RefreshCw, Search, XCircle } from 'lucide-react';
import { supabase, type Product } from '../../lib/supabase';
import { fetchAllRows } from '../../lib/data';
import { hiddenListingUpdate } from '../../lib/productListing';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';

type Action = 'cancel' | 'reject';
const money = (value: number) => `Rs. ${Number(value).toLocaleString()}`;

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [shop, setShop] = useState('all');
  const [viewing, setViewing] = useState<Product | null>(null);
  const [pending, setPending] = useState<{ product: Product; action: Action } | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError('');
    try {
      const rows = await fetchAllRows<Product>('products', '*, sellers(id,business_name,shop_location,status)');
      setProducts(rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
    } catch { setError('Could not load products. Please try again.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function moderate() {
    if (!pending || saving) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const { data, error: saveError } = await supabase.from('products').update(hiddenListingUpdate()).eq('id', pending.product.id).select('id,is_active').maybeSingle();
      if (saveError || !data || data.is_active !== false) throw new Error('not saved');
      setProducts(rows => rows.map(p => p.id === data.id ? { ...p, is_active: false } : p));
      setViewing(p => p?.id === data.id ? { ...p, is_active: false } : p);
      setNotice(`${pending.product.name} ${pending.action === 'reject' ? 'rejected' : 'cancelled'} and removed from sale.`);
      setPending(null);
    } catch { setError('The product change was not saved. Please try again.'); }
    finally { setSaving(false); }
  }

  const shops = [...new Map(products.map(p => [p.seller_id, p.sellers?.business_name || 'Unknown shop'])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const query = search.trim().toLowerCase();
  const filtered = products.filter(p => (status === 'all' || p.is_active === (status === 'active')) && (shop === 'all' || p.seller_id === shop) && `${p.name} ${p.description || ''} ${p.sellers?.business_name || ''} ${p.category} ${p.id}`.toLowerCase().includes(query));
  const actions = (p: Product) => <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!p.is_active || saving} onClick={() => { setError(''); setViewing(null); setPending({ product: p, action: 'cancel' }); }}><XCircle size={14} />Cancel listing</Button><Button variant="danger" disabled={!p.is_active || saving} onClick={() => { setError(''); setViewing(null); setPending({ product: p, action: 'reject' }); }}><Ban size={14} />Reject</Button></div>;

  return <section className="text-foreground">
    <header className="flex items-start justify-between gap-3 mb-5"><div><h1 className="text-2xl font-black">All Products</h1><p className="text-sm text-muted-foreground mt-1">{products.length} products · {products.filter(p => p.is_active).length} active listings</p></div><Button variant="outline" onClick={load} disabled={loading} aria-label="Refresh products" title="Refresh products" className="h-9 w-9 p-0 shrink-0"><RefreshCw size={16} /></Button></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_200px_170px] mb-5">
      <div className="relative sm:col-span-2 xl:col-span-1"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input aria-label="Search products" placeholder="Search products or shops" value={search} onChange={e => setSearch(e.target.value)} className="w-full min-w-0 rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm" /></div>
      <select aria-label="Filter by shop" value={shop} onChange={e => setShop(e.target.value)} className="w-full min-w-0 rounded-md border border-border bg-card px-3 py-2 text-sm"><option value="all">All shops</option>{shops.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select aria-label="Filter by listing status" value={status} onChange={e => setStatus(e.target.value)} className="w-full min-w-0 rounded-md border border-border bg-card px-3 py-2 text-sm"><option value="all">All listings</option><option value="active">Active</option><option value="inactive">Unavailable</option></select>
    </div>
    {error && !pending && <p role="alert" className="text-destructive text-sm mb-4">{error}</p>}
    {notice && <p role="status" className="text-sm bg-chart-green/10 border border-chart-green/30 rounded-md p-3 mb-4">{notice}</p>}
    {loading ? <p role="status" className="py-12 text-center text-muted-foreground">Loading products…</p> : !filtered.length ? <div className="text-center py-16"><Package size={40} className="mx-auto mb-3 text-muted-foreground" /><p className="font-semibold">No products found</p></div> : <div className="grid lg:grid-cols-2 gap-4">{filtered.map(p => <article key={p.id} className="min-w-0 bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 flex items-start gap-4">
        {p.image_urls[0] ? <img src={p.image_urls[0]} alt={p.name} className="w-20 h-24 object-cover rounded-md shrink-0 bg-muted" /> : <div className="w-20 h-24 rounded-md bg-muted shrink-0 flex items-center justify-center"><Package className="text-muted-foreground" /></div>}
        <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground break-words">{p.sellers?.business_name || 'Unknown shop'}</p><h2 className="font-bold break-words mt-1">{p.name}</h2><p className="text-xs text-muted-foreground capitalize mt-1">{p.category.replace(/_/g, ' ')} · Stock: {p.stock}</p><p className="font-bold text-primary mt-2">{money(p.real_price)}</p><span className={`inline-block mt-2 rounded px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-chart-green/10 text-chart-green' : 'bg-muted text-muted-foreground'}`}>{p.is_active ? 'Active' : 'Unavailable'}</span></div>
      </div>
      <div className="border-t border-border px-4 py-3 flex flex-wrap gap-2"><Button variant="outline" onClick={() => setViewing(p)}><Eye size={14} />View</Button>{actions(p)}</div>
    </article>)}</div>}
    {viewing && <Dialog title="Product details" onClose={() => setViewing(null)}>
      <h3 className="font-bold break-words mb-3">{viewing.name}</h3>
      {viewing.image_urls.length > 0 && <div className="flex gap-2 overflow-x-auto mb-4">{viewing.image_urls.map((url, i) => <img key={i} src={url} alt={`${viewing.name} photo ${i + 1}`} className="w-32 h-40 object-cover rounded-md shrink-0 bg-muted" />)}</div>}
      <dl className="grid grid-cols-2 gap-3 text-sm mb-4"><div className="min-w-0"><dt className="text-xs text-muted-foreground">Shop</dt><dd className="font-semibold break-words">{viewing.sellers?.business_name || 'Unknown shop'}</dd></div><div><dt className="text-xs text-muted-foreground">Shop status</dt><dd className="capitalize">{viewing.sellers?.status || 'Unknown'}</dd></div><div><dt className="text-xs text-muted-foreground">Price</dt><dd className="font-bold">{money(viewing.real_price)}</dd></div><div><dt className="text-xs text-muted-foreground">Stock</dt><dd>{viewing.stock}</dd></div><div className="col-span-2"><dt className="text-xs text-muted-foreground">Categories</dt><dd className="capitalize break-words">{(viewing.categories?.length ? viewing.categories : [viewing.category]).join(', ').replace(/_/g, ' ')}</dd></div><div><dt className="text-xs text-muted-foreground">Listing status</dt><dd>{viewing.is_active ? 'Active' : 'Unavailable'}</dd></div><div><dt className="text-xs text-muted-foreground">Added</dt><dd>{new Date(viewing.created_at).toLocaleDateString()}</dd></div><div className="col-span-2"><dt className="text-xs text-muted-foreground">Product ID</dt><dd className="break-all">{viewing.id}</dd></div></dl>
      {viewing.description && <p className="text-sm whitespace-pre-wrap break-words mb-4">{viewing.description}</p>}
      {(viewing.video_data || viewing.video_url) && <video src={viewing.video_data || viewing.video_url} controls className="w-full max-h-64 mb-4 rounded-md" />}
      {actions(viewing)}
    </Dialog>}
    {pending && <Dialog title={pending.action === 'reject' ? 'Reject product?' : 'Cancel listing?'} onClose={() => { if (!saving) setPending(null); }}><p className="font-semibold break-words">{pending.product.name}</p><p className="text-sm text-muted-foreground mt-2 mb-5">This product will be removed from sale. Existing customer orders and their tracking will remain unchanged.</p>{error && <p role="alert" className="text-sm text-destructive mb-4">{error}</p>}<div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={saving} onClick={() => setPending(null)}>Keep listing</Button><Button variant="danger" disabled={saving} onClick={moderate}>{saving ? 'Saving…' : pending.action === 'reject' ? 'Reject product' : 'Cancel listing'}</Button></div></Dialog>}
  </section>;
}
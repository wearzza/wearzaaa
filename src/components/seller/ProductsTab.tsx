import { useEffect, useState } from 'react';
import { Edit, Package, Plus, Search, Trash2, Truck } from 'lucide-react';
import { supabase, type Product, type Seller } from '../../lib/supabase';
import { fetchAllRows } from '../../lib/data';
import ProductEditor from './ProductEditor';
import Button from '../ui/Button';

export default function ProductsTab({ seller }: { seller: Seller }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  async function load() {
    setLoading(true); setError('');
    try { const rows = await fetchAllRows<Product>('products', '*', seller.id); setProducts(rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))); }
    catch { setError('Could not load your products. Please try again.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [seller.id]);
  async function delivery(ids: string[], free: boolean) {
    if (!ids.length || saving) return;
    if (!window.confirm(`${free ? 'Enable' : 'Remove'} free delivery for ${ids.length} product${ids.length === 1 ? '' : 's'}?`)) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const { data, error: e } = await supabase.from('products').update({ free_delivery: free, updated_at: new Date().toISOString() }).eq('seller_id', seller.id).in('id', ids).select('id');
      if (e || data?.length !== ids.length) throw new Error('Not saved');
      setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, free_delivery: free } : p));
      setNotice(`${free ? 'Free delivery enabled' : 'Free delivery removed'} for ${ids.length} products.`); setSelected([]);
    } catch { setError('The delivery change was not saved. Please try again.'); }
    finally { setSaving(false); }
  }
  async function hide(p: Product) {
    if (!window.confirm(`Remove ${p.name} from sale? Existing orders stay saved.`)) return;
    const { data, error: e } = await supabase.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', p.id).eq('seller_id', seller.id).select('id').single();
    if (e || !data) setError('The listing was not removed. Please try again.'); else { setNotice('Listing removed from sale.'); load(); }
  }
  const filtered = products.filter(p => `${p.name} ${p.category} ${p.variants?.map(v => `${v.size} ${v.color}`).join(' ') || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="text-foreground">
    <header className="flex justify-between items-center gap-3 mb-5"><div><h1 className="text-2xl font-black">Products</h1><p className="text-xs text-muted-foreground mt-1">{products.length} listings · {products.filter(p => p.free_delivery).length} with free delivery</p></div><Button onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} />Add product</Button></header>
    <div className="relative mb-4"><Search className="absolute left-3 top-3 text-muted-foreground" size={16} /><input aria-label="Search your products" placeholder="Search products, sizes or colors" value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-2 text-sm" /></div>
    <div className="border-y border-border py-3 mb-5 flex flex-wrap items-center gap-2">
      <label className="text-xs flex items-center gap-2 mr-2"><input aria-label="Select visible products" type="checkbox" checked={filtered.length > 0 && filtered.every(p => selected.includes(p.id))} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...filtered.map(p => p.id)])] : selected.filter(id => !filtered.some(p => p.id === id)))} className="accent-primary" />{selected.length ? `${selected.length} selected` : 'Select products'}</label>
      <Button variant="outline" disabled={!selected.length || saving} onClick={() => delivery(selected, true)} className="text-xs"><Truck size={14} />Free delivery: selected</Button>
      <Button variant="outline" disabled={!products.some(p => (p.product_type || 'clothing') === 'clothing') || saving} onClick={() => delivery(products.filter(p => (p.product_type || 'clothing') === 'clothing').map(p => p.id), true)} className="text-xs">Free delivery: all clothing</Button>
      <Button variant="ghost" disabled={!selected.length || saving} onClick={() => delivery(selected, false)} className="text-xs">Remove free delivery</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive mb-4">{error}</p>}{notice && <p role="status" className="text-sm text-chart-green mb-4">{notice}</p>}
    {loading ? <p role="status" className="py-12 text-center text-muted-foreground">Loading products…</p> : !filtered.length ? <div className="py-16 text-center"><Package className="mx-auto mb-3 text-muted-foreground" size={40} /><p className="font-semibold">No products found</p></div> : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map(p => <article key={p.id} className="min-w-0 border border-border bg-card rounded-lg overflow-hidden"><div className="relative aspect-[4/3] bg-muted">{p.image_urls[0] ? <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" /> : <Package className="absolute inset-0 m-auto text-muted-foreground" size={36} />}<label className="absolute left-2 top-2 bg-card rounded p-2 flex"><input aria-label={`Select ${p.name}`} type="checkbox" checked={selected.includes(p.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))} className="accent-primary w-4 h-4" /></label></div><div className="p-3 space-y-2"><h2 className="font-bold break-words">{p.name}</h2><p className="text-xs text-muted-foreground capitalize">{p.product_type || 'Clothing'} · {p.variants?.length || 0} options · Stock {p.stock}</p><p className="text-primary font-bold">{p.variants?.length ? 'From ' : ''}Rs. {Number(p.real_price).toLocaleString()}</p>{p.free_delivery && <p className="text-chart-green text-xs flex items-center gap-1"><Truck size={13} />Free delivery</p>}{!p.is_active && <p className="text-destructive text-xs">Unavailable</p>}<div className="flex justify-end gap-2 border-t border-border pt-2"><Button variant="outline" onClick={() => { setEditing(p); setOpen(true); }}><Edit size={14} />Edit</Button><Button variant="ghost" disabled={!p.is_active} aria-label={`Remove ${p.name} from sale`} title="Remove from sale" onClick={() => hide(p)} className="text-destructive"><Trash2 size={16} /></Button></div></div></article>)}</div>}
    {open && <ProductEditor seller={seller} product={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); setNotice('Product saved.'); load(); }} />}
  </section>;
}
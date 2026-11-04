import { useEffect, useState } from 'react';
import { supabase, type Order, type Product } from '../../lib/supabase';
import { Package, Truck, MapPin, RefreshCw, XCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { canCustomerCancel, cancellationLabel, STATUS_TONE, statusLabel } from '../../lib/commerce';
import { loadTrackedOrder, loadOrderLookup, readTrackedOrders } from '../../lib/orderTracking';
import { canManageGuestOrder, readOrderLookups, savedOrderReferences } from '../../lib/guestOrderStorage';
import { useCart } from '../../contexts/CartContext';
import CancelOrderDialog from '../CancelOrderDialog';
import Button from '../ui/Button';

export default function OrdersPage({ onHome }: { onHome: () => void }) {
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [filter, setFilter] = useState('all');
  const [lookupNumber, setLookupNumber] = useState('');
  const [finding, setFinding] = useState(false);
  const [found, setFound] = useState<Order[]>([]);
  async function load() {
    setError('');
    try {
      const [tracked, lookedUp] = await Promise.all([
        Promise.allSettled(readTrackedOrders().map(loadTrackedOrder)),
        Promise.allSettled(readOrderLookups(localStorage).map(loadOrderLookup)),
      ]);
      const results = tracked.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
      const recovered = lookedUp.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
      setOrders(prev => [...results, ...prev.filter(order => !results.some(r => r.id === order.id) && tracked.some(r => r.status === 'rejected'))].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
      setFound(prev => [...recovered, ...prev.filter(order => !recovered.some(r => r.id === order.id) && lookedUp.some(r => r.status === 'rejected'))]);
      if ([...tracked, ...lookedUp].some(result => result.status === 'rejected')) setError('Some orders could not refresh. Please try again.');
    } catch { setError('Could not load your orders. Please try again.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener('focus', load);
    return () => { clearInterval(timer); window.removeEventListener('focus', load); };
  }, []);
  async function cancel(reason: string, details: string) {
    if (!selected) return;
    const tracking = readTrackedOrders().find(r => r.id === selected.id);
    if (!tracking) throw new Error('This device does not have access to cancel this order.');
    const { data, error } = await supabase.rpc('wearza_cancel_customer_order', { _order_id: selected.id, _token: tracking.token, _reason: reason, _details: details });
    if (error || !data) { await load(); throw new Error(error?.message || 'Cancellation was not saved.'); }
    setOrders(prev => prev.map(order => order.id === selected.id ? data as Order : order));
    setSelected(null); setNotice('Your order was cancelled. No payment is due.');
  }
  async function orderAgain(order: Order) {
    const ids = (order.order_items || []).map(i => i.product_id).filter(Boolean) as string[];
    const { data } = await supabase.from('products').select('*').in('id', ids).eq('is_active', true);
    if (!data?.length) { setNotice('These products are no longer available.'); return; }
    order.order_items?.forEach(i => { const p = data.find(d => d.id === i.product_id); if (p) addToCart(p as Product, i.quantity, i.selected_size || undefined); });
    setNotice('Items added to your cart. Open the cart to place a new order.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function findOrder(e: React.FormEvent) {
    e.preventDefault();
    if (finding) return;
    setError(''); setNotice(''); setFinding(true);
    try {
      const saved = savedOrderReferences(lookupNumber, readTrackedOrders(), readOrderLookups(localStorage));
      if (!saved.tracking && !saved.lookup) { setError('This order is not saved on this device. Use the device where you placed or saved the order.'); return; }
      const order = saved.tracking ? await loadTrackedOrder(saved.tracking) : saved.lookup ? await loadOrderLookup(saved.lookup) : null;
      if (!order) { setError('No order found. Check the saved order number.'); return; }
      if (saved.tracking) setOrders(prev => [order, ...prev.filter(row => row.id !== order.id)]);
      else setFound(prev => [order, ...prev.filter(row => row.id !== order.id)]);
      setNotice(`Order #${order.order_number} found.`);
    } catch { setError('Could not track this order. Please try again.'); }
    finally { setFinding(false); }
  }
  const all = [...orders, ...found.filter(f => !orders.some(o => o.id === f.id))];
  const filtered = all.filter(o => filter === 'all' || (filter === 'active' ? o.status !== 'delivered' && o.status !== 'cancelled' : o.status === filter));
  return <div className="max-w-3xl mx-auto px-4 py-6 text-foreground">
    <header className="flex items-center justify-between gap-3 mb-5"><h1 className="text-2xl font-black">My Orders</h1><Button variant="outline" aria-label="Refresh orders" title="Refresh orders" onClick={load} className="w-9 h-9 p-0"><RefreshCw size={16} /></Button></header>
    <form onSubmit={findOrder} className="mb-5"><h2 className="font-bold text-sm mb-3">Track an order</h2><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><input required value={lookupNumber} onChange={e => setLookupNumber(e.target.value)} placeholder="Order number e.g. WZ-261103-AB12CD" aria-label="Order number" className="min-w-0 px-3 py-2 rounded-md border border-border bg-background text-sm uppercase" /><Button type="submit" disabled={finding}>{finding ? 'Tracking…' : 'Track'}</Button></div></form>
    <div className="flex gap-2 overflow-x-auto mb-5" aria-label="Order filters">{['all', 'active', 'delivered', 'cancelled'].map(f => <Button key={f} variant={f === filter ? 'primary' : 'outline'} onClick={() => setFilter(f)} aria-pressed={f === filter} className="capitalize shrink-0">{f}</Button>)}</div>
    {error && <p role="alert" className="mb-4 text-destructive text-sm">{error}</p>}
    {notice && <p role="status" className="mb-4 p-3 bg-chart-green/10 border border-chart-green/30 rounded-md text-sm">{notice}</p>}
    {loading ? <p role="status" className="text-center py-12 text-muted-foreground">Loading orders…</p> : filtered.length === 0 ? <div className="text-center py-16"><Package size={40} className="mx-auto text-muted-foreground mb-4" /><h2 className="font-bold">No orders found</h2><p className="text-sm text-muted-foreground mt-2 mb-5">New orders placed on this device will appear here.</p><Button onClick={onHome}>Start shopping</Button></div> : <div className="space-y-4">{filtered.map(order => <article key={order.id} className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><p className="text-xs text-muted-foreground">#{order.order_number}</p><p className="text-sm font-semibold mt-1">{new Date(order.created_at).toLocaleDateString('en', { dateStyle: 'medium' })}</p></div><span className={`px-3 py-1 text-xs rounded-full font-bold ${STATUS_TONE[order.status]}`}>{statusLabel(order.status)}</span></div>
      <div className="space-y-3 mb-4">{order.order_items?.map(item => <div key={item.id} className="flex items-center gap-3">{item.product_image ? <img src={item.product_image} alt="" className="w-12 h-12 object-cover rounded-md shrink-0" /> : <Package className="w-12 h-12 text-muted-foreground shrink-0" />}<div className="min-w-0 flex-1"><p className="text-sm font-semibold break-words">{item.product_name}</p><p className="text-xs text-muted-foreground">Qty {item.quantity}{item.selected_size ? ` · Size ${item.selected_size}` : ''}</p></div><span className="text-sm font-bold shrink-0">Rs. {Number(item.total_price).toLocaleString()}</span></div>)}</div>
      {order.status !== 'cancelled' && <ol className="grid grid-cols-4 gap-2 mb-4" aria-label="Order progress">{(['pending', 'processing', 'confirmed', 'delivered'] as const).map((s, i) => { const step = order.status === 'shipped' ? 2 : ['pending', 'processing', 'confirmed', 'delivered'].indexOf(order.status); return <li key={s} className={`border-t-2 pt-2 text-[10px] sm:text-xs ${i <= step ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}`}>{statusLabel(s)}</li>; })}</ol>}
      {order.province && <p className="flex gap-2 text-xs text-muted-foreground mb-4"><MapPin size={14} className="shrink-0" />{order.municipality}-{order.ward_number}, {order.district}, {order.province}</p>}
      {order.status === 'cancelled' && <div className="bg-muted p-3 rounded-md text-sm mb-4"><p className="font-semibold flex gap-2 items-center"><XCircle size={15} />Cancelled by {order.cancelled_by || 'seller'}</p><p className="mt-1 text-muted-foreground">{cancellationLabel(order.cancellation_reason)}</p>{order.cancellation_details && <p className="mt-1 break-words text-muted-foreground">{order.cancellation_details}</p>}<p className="text-xs mt-2">No payment due · Cash on Delivery</p></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><div><p className="text-xs text-muted-foreground">Total</p><strong className="text-primary">Rs. {Number(order.total).toLocaleString()}</strong></div>{canCustomerCancel(order.status) && canManageGuestOrder(order.id, readTrackedOrders()) ? <Button variant="outline" onClick={() => setSelected(order)} className="text-destructive"><XCircle size={14} />Cancel order</Button> : order.status === 'cancelled' ? <Button onClick={() => orderAgain(order)}><ShoppingCart size={14} />Order again</Button> : <span className="flex items-center gap-1 text-xs text-muted-foreground">{order.status === 'delivered' ? <CheckCircle size={14} /> : <Truck size={14} />}Cash on Delivery</span>}</div>
      {canCustomerCancel(order.status) && !canManageGuestOrder(order.id, readTrackedOrders()) && <p className="text-xs text-muted-foreground mt-3">To cancel, use the device you placed this order on.</p>}
      {(order.status === 'confirmed' || order.status === 'shipped') && <p className="text-xs text-muted-foreground mt-3">The seller confirmed your order. Cancellation is now closed.</p>}
    </article>)}</div>}
    {selected && <CancelOrderDialog order={selected} actor="customer" onClose={() => setSelected(null)} onConfirm={cancel} />}
  </div>;
}

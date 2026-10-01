import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Clock, Package, Receipt, RefreshCw, ShoppingBag, Star, Wallet } from 'lucide-react';
import { supabase, type OrderStatus, type Seller } from '../../lib/supabase';
import { AreaChart, BarChart, Donut, Funnel, Heatmap, KpiCard, Panel, PeriodPicker, RankList, buckets, compactMoney, count, inPeriod, money, pct, type Period } from '../analytics/charts';

type OrderRow = { id: string; order_number: string; customer_name: string; total: number; status: OrderStatus; created_at: string; province?: string | null };
type ProductRow = { id: string; name: string; stock: number; is_active: boolean; real_price: number; avg_rating?: number; review_count?: number; created_at: string };
type ItemRow = { product_name: string; quantity?: number; price?: number; created_at: string };
const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const statusTone: Record<OrderStatus, string> = { pending: 'bg-chart-amber/15 text-chart-amber', confirmed: 'bg-chart-blue/15 text-chart-blue', shipped: 'bg-chart-violet/15 text-chart-violet', delivered: 'bg-chart-green/15 text-chart-green', cancelled: 'bg-destructive/15 text-destructive' };
const delivered = (r: OrderRow) => (r.status === 'delivered' ? Number(r.total) || 0 : 0);

export default function SellerAnalytics({ seller, onNavigate }: { seller: Seller; onNavigate: (tab: 'products' | 'orders') => void }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [period, setPeriod] = useState<Period>(30);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.allSettled([
      supabase.from('orders').select('id,order_number,customer_name,total,status,created_at,province').eq('seller_id', seller.id),
      supabase.from('products').select('*').eq('seller_id', seller.id),
      supabase.from('order_items').select('*').eq('seller_id', seller.id),
    ]).then(([o, p, i]) => {
      if (!active) return;
      const ok = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' && !r.value.error;
      setOrders(ok(o) ? (o as any).value.data || [] : []);
      setProducts(ok(p) ? (p as any).value.data || [] : []);
      setItems(ok(i) ? (i as any).value.data || [] : []);
      setFailed(!ok(o) || !ok(p));
      setLoading(false);
    });
    return () => { active = false; };
  }, [seller.id, reload]);

  const s = useMemo(() => {
    const cur = inPeriod(orders, period), prev = inPeriod(orders, period, 1);
    const rev = cur.reduce((a, r) => a + delivered(r), 0), prevRev = prev.reduce((a, r) => a + delivered(r), 0);
    const del = cur.filter(r => r.status === 'delivered').length, prevDel = prev.filter(r => r.status === 'delivered').length;
    const aov = del ? rev / del : 0, prevAov = prevDel ? prevRev / prevDel : 0;
    const reached = (st: OrderStatus[]) => cur.filter(r => st.includes(r.status)).length;
    const productMap = new Map<string, { value: number; units: number }>();
    inPeriod(items, period).forEach(it => { const e = productMap.get(it.product_name) || { value: 0, units: 0 }; const q = Number(it.quantity) || 1; e.units += q; e.value += q * (Number(it.price) || 0); productMap.set(it.product_name, e); });
    const rated = products.filter(p => (p.review_count || 0) > 0);
    return {
      cur, rev, prevRev, del, aov, prevAov,
      pending: cur.filter(r => r.status === 'pending').length,
      revTrend: buckets(orders, period, 0, delivered), revPrev: buckets(orders, period, 1, delivered).map(p => p.value),
      orderTrend: buckets(orders, period),
      dist: statuses.map(st => ({ label: st, value: cur.filter(r => r.status === st).length })),
      funnel: [{ label: 'placed', value: cur.length }, { label: 'confirmed', value: reached(['confirmed', 'shipped', 'delivered']) }, { label: 'shipped', value: reached(['shipped', 'delivered']) }, { label: 'delivered', value: del }],
      top: [...productMap].map(([label, e]) => ({ label, value: e.units, sub: e.value ? compactMoney(e.value) : undefined })).sort((a, b) => b.value - a.value).slice(0, 6),
      active: products.filter(p => p.is_active).length,
      lowStock: products.filter(p => p.is_active && p.stock <= 5).sort((a, b) => a.stock - b.stock),
      rating: rated.length ? rated.reduce((a, p) => a + (p.avg_rating || 0) * (p.review_count || 0), 0) / rated.reduce((a, p) => a + (p.review_count || 0), 0) : 0,
      reviews: products.reduce((a, p) => a + (p.review_count || 0), 0),
      recent: [...orders].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6),
    };
  }, [orders, products, items, period]);

  if (loading) return <div className="analytics-shell"><div className="h-8 w-64 bg-muted rounded animate-pulse mb-5" /><div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="dash-panel h-32 animate-pulse bg-muted" />)}</div><p className="sr-only" role="status">Loading your store performance…</p></div>;

  return <div className="analytics-shell">
    <header className="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Seller Center · {seller.business_name}</p><h1 className="analytics-title">Welcome back, {seller.full_name.split(' ')[0]}</h1><p className="text-sm text-muted-foreground mt-1">Your store performance over the last {period} days</p></div>
      <div className="flex items-center gap-2"><PeriodPicker value={period} onChange={setPeriod} /><button onClick={() => setReload(v => v + 1)} aria-label="Refresh data" title="Refresh data" className="analytics-icon-button"><RefreshCw size={16} /></button></div>
    </header>
    {failed && <div role="alert" className="flex items-center gap-2 border border-destructive/30 bg-destructive/10 text-destructive rounded-xl p-3 mb-4 text-sm"><AlertTriangle size={16} /> Some data could not load. <button className="underline ml-auto" onClick={() => setReload(v => v + 1)}>Retry</button></div>}
    {s.pending > 0 && <button onClick={() => onNavigate('orders')} className="w-full flex items-center gap-3 rounded-xl border border-chart-amber/30 bg-chart-amber/10 p-3 mb-4 text-left text-sm"><Clock size={18} className="text-chart-amber shrink-0" /><span className="text-foreground"><b>{s.pending} order{s.pending > 1 ? 's' : ''}</b> waiting for confirmation — process them quickly to keep your rating high.</span><span className="ml-auto text-xs font-bold text-primary shrink-0">View →</span></button>}

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
      <KpiCard label="Sales (delivered)" value={compactMoney(s.rev)} delta={pct(s.rev, s.prevRev)} context="vs prev." icon={Wallet} spark={s.revTrend.map(p => p.value)} color="var(--chart-1)" />
      <KpiCard label="Orders" value={count(s.cur.length)} context={`${s.pending} pending`} icon={ShoppingBag} spark={s.orderTrend.map(p => p.value)} color="var(--chart-2)" />
      <KpiCard label="Avg. order value" value={compactMoney(s.aov)} delta={pct(s.aov, s.prevAov)} context="vs prev." icon={Receipt} color="var(--chart-3)" />
      <KpiCard label="Store rating" value={s.rating ? `${s.rating.toFixed(1)} ★` : '—'} context={`${count(s.reviews)} reviews`} icon={Star} color="var(--chart-amber)" />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-3">
      <Panel className="xl:col-span-2" title="Sales trend" subtitle={`Delivered sales · dashed line = previous ${period} days`} action={<span className="text-sm font-extrabold text-foreground">{money(s.rev)}</span>}><AreaChart data={s.revTrend} compare={s.revPrev} format={money} /></Panel>
      <Panel title="Order status"><Donut values={s.dist} colors={['var(--chart-amber)', 'var(--chart-blue)', 'var(--chart-violet)', 'var(--chart-green)', 'var(--chart-red)']} centerLabel="orders" /><div className="mt-5 pt-4 border-t border-border"><p className="text-xs font-semibold text-muted-foreground mb-3">Fulfilment funnel</p><Funnel steps={s.funnel} /></div></Panel>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
      <Panel title="Orders received" subtitle="Per interval"><BarChart data={s.orderTrend} /></Panel>
      <Panel title="Best-selling products" subtitle="Units sold this period"><RankList items={s.top} empty="No product sales this period." /></Panel>
      <Panel title="When customers order" subtitle="Weekday × time of day"><Heatmap dates={s.cur.map(r => r.created_at)} /></Panel>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
      <Panel className="xl:col-span-2" title="Recent orders" action={<button onClick={() => onNavigate('orders')} className="text-xs font-bold text-primary">View all</button>}>
        {s.recent.length === 0 ? <p className="text-sm text-muted-foreground py-10 text-center">No orders yet. Share your store to get your first sale.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs min-w-[440px]"><thead className="text-muted-foreground border-b border-border"><tr><th className="py-2.5 font-medium">Order</th><th className="py-2.5 font-medium">Date</th><th className="py-2.5 font-medium">Status</th><th className="py-2.5 font-medium text-right">Total</th></tr></thead><tbody>{s.recent.map(r => <tr key={r.id} className="border-b border-border last:border-0"><td className="py-2.5"><span className="font-bold text-foreground">#{r.order_number}</span><br /><span className="text-muted-foreground">{r.customer_name}</span></td><td className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td><td><span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${statusTone[r.status]}`}>{r.status}</span></td><td className="text-right font-bold text-foreground">{money(Number(r.total) || 0)}</td></tr>)}</tbody></table></div>}
      </Panel>
      <Panel title="Inventory health" subtitle={`${s.active} active of ${products.length} products`} action={<button onClick={() => onNavigate('products')} className="text-xs font-bold text-primary">Manage</button>}>
        <div className="grid grid-cols-2 gap-2 mb-4"><div className="rounded-lg bg-muted p-3"><Package size={14} className="text-chart-blue" /><p className="text-lg font-extrabold text-foreground mt-1">{s.active}</p><p className="text-[11px] text-muted-foreground">Live listings</p></div><div className="rounded-lg bg-muted p-3"><Boxes size={14} className="text-chart-amber" /><p className="text-lg font-extrabold text-foreground mt-1">{s.lowStock.length}</p><p className="text-[11px] text-muted-foreground">Low stock</p></div></div>
        {s.lowStock.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">All products are well stocked.</p> : <ul className="divide-y divide-border">{s.lowStock.slice(0, 5).map(p => <li key={p.id} className="py-2 flex justify-between gap-2 text-xs"><span className="text-foreground truncate">{p.name}</span><span className={`font-bold shrink-0 ${p.stock === 0 ? 'text-destructive' : 'text-chart-amber'}`}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span></li>)}</ul>}
      </Panel>
    </div>
  </div>;
}

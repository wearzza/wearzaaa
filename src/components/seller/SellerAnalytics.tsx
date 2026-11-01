import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Clock, Package, Receipt, RefreshCw, ShoppingBag, Star, Wallet } from 'lucide-react';
import { supabase, type OrderStatus, type Seller } from '../../lib/supabase';
import { AreaChart, BarChart, Donut, Funnel, Heatmap, KpiCard, Panel, PeriodPicker, RankList, buckets, compactMoney, count, inPeriod, money, pct, type Period } from '../analytics/charts';
import { COMMISSION_PERCENT, earningsSummary, ORDER_STATUSES, STATUS_TONE, statusLabel } from '../../lib/commerce';
import { fetchAllRows } from '../../lib/data';
import Button from '../ui/Button';

type OrderRow = { id: string; order_number: string; customer_name: string; total: number; status: OrderStatus; commission_paid: boolean; created_at: string; province?: string | null };
type ProductRow = { id: string; name: string; stock: number; is_active: boolean; real_price: number; avg_rating?: number; review_count?: number; created_at: string };
type ItemRow = { order_id: string; product_name: string; quantity?: number; total_price?: number; created_at: string };
const delivered = (r: OrderRow) => (r.status === 'delivered' ? Number(r.total) || 0 : 0);

export default function SellerAnalytics({ seller, onNavigate, adminView = false }: { seller: Seller; onNavigate?: (tab: 'products' | 'orders') => void; adminView?: boolean }) {
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
      fetchAllRows<OrderRow>('orders', 'id,order_number,customer_name,total,status,commission_paid,created_at,province', seller.id),
      fetchAllRows<ProductRow>('products', '*', seller.id),
      fetchAllRows<ItemRow>('order_items', '*', seller.id),
    ]).then(([o, p, i]) => {
      if (!active) return;
      setOrders(o.status === 'fulfilled' ? o.value : []);
      setProducts(p.status === 'fulfilled' ? p.value : []);
      setItems(i.status === 'fulfilled' ? i.value : []);
      setFailed(o.status !== 'fulfilled' || p.status !== 'fulfilled' || i.status !== 'fulfilled');
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
    const deliveredIds = new Set(cur.filter(o => o.status === 'delivered').map(o => o.id));
    items.filter(it => deliveredIds.has(it.order_id)).forEach(it => { const e = productMap.get(it.product_name) || { value: 0, units: 0 }; const q = Number(it.quantity) || 1; e.units += q; e.value += Number(it.total_price) || 0; productMap.set(it.product_name, e); });
    const rated = products.filter(p => (p.review_count || 0) > 0);
    return {
      cur, rev, prevRev, del, aov, prevAov,
      earnings: earningsSummary(cur), lifetime: earningsSummary(orders),
      inProgress: cur.filter(r => ['pending', 'processing', 'confirmed', 'shipped'].includes(r.status)).reduce((sum, r) => sum + Number(r.total), 0),
      cancelled: cur.filter(r => r.status === 'cancelled').length,
      pending: cur.filter(r => r.status === 'pending').length,
      revTrend: buckets(orders, period, 0, delivered), revPrev: buckets(orders, period, 1, delivered).map(p => p.value),
      orderTrend: buckets(orders, period),
      dist: ORDER_STATUSES.map(st => ({ label: st, value: cur.filter(r => r.status === st || (st === 'confirmed' && r.status === 'shipped')).length })),
      funnel: [{ label: 'placed', value: cur.length }, { label: 'processing', value: reached(['processing', 'confirmed', 'shipped', 'delivered']) }, { label: 'confirmed', value: reached(['confirmed', 'shipped', 'delivered']) }, { label: 'delivered', value: del }],
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
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">{adminView ? 'Admin · Seller performance' : 'Seller Center'} · {seller.business_name}</p><h1 className="analytics-title">{adminView ? seller.business_name : `Welcome back, ${seller.full_name.split(' ')[0]}`}</h1><p className="text-sm text-muted-foreground mt-1">Last {period} days · {COMMISSION_PERCENT}% Wearza commission</p></div>
      <div className="flex items-center gap-2"><PeriodPicker value={period} onChange={setPeriod} /><Button variant="outline" onClick={() => setReload(v => v + 1)} aria-label="Refresh data" title="Refresh data" className="h-9 w-9 p-0"><RefreshCw size={16} /></Button></div>
    </header>
    {failed && <div role="alert" className="flex items-center gap-2 border border-destructive/30 bg-destructive/10 text-destructive rounded-xl p-3 mb-4 text-sm"><AlertTriangle size={16} /> Some data could not load. <button className="underline ml-auto" onClick={() => setReload(v => v + 1)}>Retry</button></div>}
    {s.pending > 0 && onNavigate && <Button variant="outline" onClick={() => onNavigate('orders')} className="w-full justify-start mb-4 text-chart-amber"><Clock size={18} /><span>{s.pending} orders awaiting review</span></Button>}

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
      <KpiCard label="Seller earnings" value={compactMoney(s.earnings.sellerNet)} context="After platform commission" icon={Wallet} color="var(--chart-green)" />
      <KpiCard label="Wearza commission" value={compactMoney(s.earnings.commission)} context="10% of delivered sales" icon={Receipt} color="var(--chart-blue)" />
      <KpiCard label="Commission due" value={compactMoney(s.earnings.due)} context={`${money(s.earnings.paid)} paid`} icon={Clock} color="var(--chart-amber)" />
      <KpiCard label="Open order value" value={compactMoney(s.inProgress)} context={`${s.cancelled} cancelled orders`} icon={ShoppingBag} color="var(--chart-violet)" />
    </div>

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
      <KpiCard label="Sales (delivered)" value={compactMoney(s.rev)} delta={pct(s.rev, s.prevRev)} context="vs prev." icon={Wallet} spark={s.revTrend.map(p => p.value)} color="var(--chart-1)" />
      <KpiCard label="Orders" value={count(s.cur.length)} context={`${s.pending} pending`} icon={ShoppingBag} spark={s.orderTrend.map(p => p.value)} color="var(--chart-2)" />
      <KpiCard label="Avg. order value" value={compactMoney(s.aov)} delta={pct(s.aov, s.prevAov)} context="vs prev." icon={Receipt} color="var(--chart-3)" />
      <KpiCard label="Store rating" value={s.rating ? `${s.rating.toFixed(1)} ★` : '—'} context={`${count(s.reviews)} reviews`} icon={Star} color="var(--chart-amber)" />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-3">
      <Panel className="xl:col-span-2" title="Sales trend" subtitle={`Delivered sales · dashed line = previous ${period} days`} action={<span className="text-sm font-extrabold text-foreground">{money(s.rev)}</span>}><AreaChart data={s.revTrend} compare={s.revPrev} format={money} /></Panel>
      <Panel title="Order status"><Donut values={s.dist} colors={['var(--chart-amber)', 'var(--chart-violet)', 'var(--chart-blue)', 'var(--chart-green)', 'var(--chart-red)']} centerLabel="orders" /><div className="mt-5 pt-4 border-t border-border"><p className="text-xs font-semibold text-muted-foreground mb-3">Fulfilment funnel</p><Funnel steps={s.funnel} /></div></Panel>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
      <Panel title="Orders received" subtitle="Per interval"><BarChart data={s.orderTrend} /></Panel>
      <Panel title="Best-selling products" subtitle="Units sold this period"><RankList items={s.top} empty="No product sales this period." /></Panel>
      <Panel title="When customers order" subtitle="Weekday × time of day"><Heatmap dates={s.cur.map(r => r.created_at)} /></Panel>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
      <Panel className="xl:col-span-2" title="Recent orders" action={onNavigate && <Button variant="ghost" onClick={() => onNavigate('orders')} className="text-xs text-primary">View all</Button>}>
        {s.recent.length === 0 ? <p className="text-sm text-muted-foreground py-10 text-center">No orders yet. Share your store to get your first sale.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs min-w-[440px]"><thead className="text-muted-foreground border-b border-border"><tr><th className="py-2.5 font-medium">Order</th><th className="py-2.5 font-medium">Date</th><th className="py-2.5 font-medium">Status</th><th className="py-2.5 font-medium text-right">Total</th></tr></thead><tbody>{s.recent.map(r => <tr key={r.id} className="border-b border-border last:border-0"><td className="py-2.5"><span className="font-bold text-foreground">#{r.order_number}</span><br /><span className="text-muted-foreground">{r.customer_name}</span></td><td className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td><td><span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${statusTone[r.status]}`}>{r.status}</span></td><td className="text-right font-bold text-foreground">{money(Number(r.total) || 0)}</td></tr>)}</tbody></table></div>}
      </Panel>
      <Panel title="Inventory health" subtitle={`${s.active} active of ${products.length} products`} action={onNavigate && <Button variant="ghost" onClick={() => onNavigate('products')} className="text-xs text-primary">Manage</Button>}>
        <div className="grid grid-cols-2 gap-2 mb-4"><div className="rounded-lg bg-muted p-3"><Package size={14} className="text-chart-blue" /><p className="text-lg font-extrabold text-foreground mt-1">{s.active}</p><p className="text-[11px] text-muted-foreground">Live listings</p></div><div className="rounded-lg bg-muted p-3"><Boxes size={14} className="text-chart-amber" /><p className="text-lg font-extrabold text-foreground mt-1">{s.lowStock.length}</p><p className="text-[11px] text-muted-foreground">Low stock</p></div></div>
        {s.lowStock.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">All products are well stocked.</p> : <ul className="divide-y divide-border">{s.lowStock.slice(0, 5).map(p => <li key={p.id} className="py-2 flex justify-between gap-2 text-xs"><span className="text-foreground truncate">{p.name}</span><span className={`font-bold shrink-0 ${p.stock === 0 ? 'text-destructive' : 'text-chart-amber'}`}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span></li>)}</ul>}
      </Panel>
    </div>
    <section className="border-t border-border mt-5 pt-5"><h2 className="font-bold text-sm mb-3">Lifetime earnings</h2><dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">{[{ label: 'Delivered sales', value: s.lifetime.sales }, { label: 'Seller earnings', value: s.lifetime.sellerNet }, { label: 'Wearza commission', value: s.lifetime.commission }, { label: 'Outstanding commission', value: s.lifetime.due }].map(item => <div key={item.label}><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className="font-bold mt-1">{money(item.value)}</dd></div>)}</dl><p className="text-xs text-muted-foreground mt-4">Earnings exclude product costs, delivery expenses, taxes and any refunds. Commission paid is recorded separately from earnings.</p></section>
  </div>;
}

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Ban, Boxes, Percent, RefreshCw, Receipt, ShoppingBag, Store, Wallet } from 'lucide-react';
import { supabase, type OrderStatus, type ProductCategory, type SellerStatus } from '../../lib/supabase';
import { AreaChart, BarChart, Donut, Funnel, Heatmap, KpiCard, Panel, PeriodPicker, RankList, buckets, compactMoney, count, inPeriod, money, pct, type Period } from '../analytics/charts';

type OrderRow = { id: string; order_number: string; customer_name: string; total: number; status: OrderStatus; created_at: string; province?: string | null; payment_method?: string | null; sellers?: { business_name: string } | null };
type SellerRow = { id: string; status: SellerStatus; business_name: string; created_at: string };
type ProductRow = { id: string; category: ProductCategory; categories?: ProductCategory[] | null; stock: number; is_active: boolean; name: string; created_at: string };
type Data = { orders: OrderRow[]; sellers: SellerRow[]; products: ProductRow[]; errors: string[] };

const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const sellerStatuses: SellerStatus[] = ['approved', 'pending', 'rejected', 'banned'];
const categories: ProductCategory[] = ['men', 'women', 'kids', 'streetwear', 'old_money', 'budget'];
const labels: Record<ProductCategory, string> = { men: 'Men', women: 'Women', kids: 'Kids', streetwear: 'Streetwear', old_money: 'Old Money', budget: 'Budget' };
const statusTone: Record<OrderStatus, string> = { pending: 'bg-chart-amber/15 text-chart-amber', confirmed: 'bg-chart-blue/15 text-chart-blue', shipped: 'bg-chart-violet/15 text-chart-violet', delivered: 'bg-chart-green/15 text-chart-green', cancelled: 'bg-destructive/15 text-destructive' };
const delivered = (r: OrderRow) => (r.status === 'delivered' ? Number(r.total) || 0 : 0);

async function fetchRows<T>(table: string, columns: string): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    const page = (data || []) as T[];
    result.push(...page);
    if (page.length < 1000) break;
  }
  return result;
}

export default function AnalyticsOverview() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(30);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.allSettled([
      fetchRows<OrderRow>('orders', '*,sellers(business_name)'),
      fetchRows<SellerRow>('sellers', 'id,status,business_name,created_at'),
      fetchRows<ProductRow>('products', 'id,category,categories,stock,is_active,name,created_at'),
    ]).then(results => {
      if (!active) return;
      const names = ['Orders', 'Sellers', 'Products'];
      setData({
        orders: results[0].status === 'fulfilled' ? results[0].value : [],
        sellers: results[1].status === 'fulfilled' ? results[1].value : [],
        products: results[2].status === 'fulfilled' ? results[2].value : [],
        errors: results.flatMap((r, i) => (r.status === 'rejected' ? [names[i]] : [])),
      });
      setLoading(false);
    });
    return () => { active = false; };
  }, [reload]);

  const o = useMemo(() => {
    if (!data) return null;
    const cur = inPeriod(data.orders, period), prev = inPeriod(data.orders, period, 1);
    const rev = cur.reduce((s, r) => s + delivered(r), 0), prevRev = prev.reduce((s, r) => s + delivered(r), 0);
    const del = cur.filter(r => r.status === 'delivered').length, prevDel = prev.filter(r => r.status === 'delivered').length;
    const aov = del ? rev / del : 0, prevAov = prevDel ? prevRev / prevDel : 0;
    const cancel = cur.length ? (cur.filter(r => r.status === 'cancelled').length / cur.length) * 100 : 0;
    const revTrend = buckets(data.orders, period, 0, delivered), revPrev = buckets(data.orders, period, 1, delivered).map(p => p.value);
    const orderTrend = buckets(data.orders, period);
    const sellerMap = new Map<string, { value: number; n: number }>();
    cur.forEach(r => { const k = r.sellers?.business_name || 'Unknown store'; const e = sellerMap.get(k) || { value: 0, n: 0 }; e.value += delivered(r); e.n++; sellerMap.set(k, e); });
    const topSellers = [...sellerMap].map(([label, e]) => ({ label, value: e.value, sub: `${e.n} orders` })).sort((a, b) => b.value - a.value).slice(0, 6);
    const regionMap = new Map<string, number>();
    cur.forEach(r => { const k = r.province || 'Unspecified'; regionMap.set(k, (regionMap.get(k) || 0) + 1); });
    const regions = [...regionMap].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    const reached = (s: OrderStatus[]) => cur.filter(r => s.includes(r.status)).length;
    const funnel = [
      { label: 'placed', value: cur.length },
      { label: 'confirmed', value: reached(['confirmed', 'shipped', 'delivered']) },
      { label: 'shipped', value: reached(['shipped', 'delivered']) },
      { label: 'delivered', value: del },
    ];
    return {
      cur, prev, rev, prevRev, aov, prevAov, cancel, revTrend, revPrev, orderTrend, topSellers, regions, funnel,
      orderDist: statuses.map(s => ({ label: s, value: cur.filter(r => r.status === s).length })),
      sellerDist: sellerStatuses.map(s => ({ label: s, value: data.sellers.filter(x => x.status === s).length })),
      catDist: categories.map(c => ({ label: labels[c], value: data.products.filter(p => (p.categories?.length ? p.categories.includes(c) : p.category === c)).length })).sort((a, b) => b.value - a.value),
      active: data.products.filter(p => p.is_active).length,
      lowStock: data.products.filter(p => p.is_active && p.stock <= 5).sort((a, b) => a.stock - b.stock),
      newSellers: inPeriod(data.sellers, period).length,
      recent: [...data.orders].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 8),
    };
  }, [data, period]);

  if (loading) return <div className="analytics-shell"><h1 className="analytics-title mb-4">Operations overview</h1><div className="grid grid-cols-2 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="dash-panel h-32 animate-pulse bg-muted" />)}</div><p className="sr-only" role="status">Loading store activity…</p></div>;
  if (!data || !o) return <div className="dash-panel">Overview unavailable. <button onClick={() => setReload(v => v + 1)} className="text-primary underline">Retry</button></div>;

  return <div className="analytics-shell">
    <header className="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Wearza Seller Central · Admin</p><h1 className="analytics-title">Operations overview</h1><p className="text-sm text-muted-foreground mt-1">Marketplace performance compared with the previous {period} days</p></div>
      <div className="flex items-center gap-2"><PeriodPicker value={period} onChange={setPeriod} /><button onClick={() => setReload(v => v + 1)} title="Refresh data" aria-label="Refresh data" className="analytics-icon-button"><RefreshCw size={16} /></button></div>
    </header>
    {data.errors.length > 0 && <div role="alert" className="flex items-center gap-2 border border-destructive/30 bg-destructive/10 text-destructive rounded-xl p-3 mb-4 text-sm"><AlertCircle size={17} /> Could not load {data.errors.join(', ').toLowerCase()}. Some figures may be incomplete. <button className="underline ml-auto" onClick={() => setReload(v => v + 1)}>Retry</button></div>}

    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-3">
      <KpiCard label="GMV (delivered)" value={compactMoney(o.rev)} delta={pct(o.rev, o.prevRev)} context="vs prev." icon={Wallet} spark={o.revTrend.map(p => p.value)} color="var(--chart-1)" />
      <KpiCard label="Orders" value={count(o.cur.length)} delta={pct(o.cur.length, o.prev.length)} context="vs prev." icon={ShoppingBag} spark={o.orderTrend.map(p => p.value)} color="var(--chart-2)" />
      <KpiCard label="Avg. order value" value={compactMoney(o.aov)} delta={pct(o.aov, o.prevAov)} context="delivered" icon={Receipt} color="var(--chart-3)" />
      <KpiCard label="Cancellation rate" value={`${o.cancel.toFixed(1)}%`} context="of orders" icon={Ban} color="var(--chart-red)" />
      <KpiCard label="Sellers" value={count(data.sellers.length)} context={`${o.newSellers} new · ${o.sellerDist[1].value} pending`} icon={Store} color="var(--chart-4)" />
      <KpiCard label="Active products" value={count(o.active)} context={`${o.lowStock.length} low stock`} icon={Boxes} color="var(--chart-5)" />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-3">
      <Panel className="xl:col-span-2" title="Revenue trend" subtitle={`Delivered GMV · dashed line = previous ${period} days`} action={<span className="text-sm font-extrabold text-foreground">{money(o.rev)}</span>}><AreaChart data={o.revTrend} compare={o.revPrev} format={money} /></Panel>
      <Panel title="Fulfilment funnel" subtitle="Order progression this period" action={<Percent size={16} className="text-muted-foreground" />}><Funnel steps={o.funnel} /><div className="mt-5 pt-4 border-t border-border"><p className="text-xs font-semibold text-muted-foreground mb-3">Order status mix</p><Donut values={o.orderDist} colors={['var(--chart-amber)', 'var(--chart-blue)', 'var(--chart-violet)', 'var(--chart-green)', 'var(--chart-red)']} centerLabel="orders" /></div></Panel>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
      <Panel title="Order volume" subtitle="Orders placed per interval"><BarChart data={o.orderTrend} /></Panel>
      <Panel title="Top sellers" subtitle="By delivered revenue"><RankList items={o.topSellers} format={compactMoney} empty="No seller sales this period." /></Panel>
      <Panel title="Peak ordering times" subtitle="Orders by weekday and time"><Heatmap dates={o.cur.map(r => r.created_at)} /></Panel>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
      <Panel title="Seller status"><Donut values={o.sellerDist} colors={['var(--chart-green)', 'var(--chart-amber)', 'var(--chart-red)', 'var(--chart-slate)']} centerLabel="sellers" /></Panel>
      <Panel title="Catalogue by category" subtitle={`${count(data.products.length)} products`}><RankList items={o.catDist} /></Panel>
      <Panel title="Orders by province"><RankList items={o.regions} empty="No orders this period." /></Panel>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
      <Panel className="xl:col-span-2" title="Recent orders">
        {o.recent.length === 0 ? <p className="text-sm text-muted-foreground py-12 text-center">No orders yet.</p> : <div className="overflow-x-auto -mx-1"><table className="w-full text-left text-xs min-w-[520px]"><thead className="text-muted-foreground border-b border-border"><tr><th className="py-2.5 px-1 font-medium">Order</th><th className="py-2.5 font-medium">Store</th><th className="py-2.5 font-medium">Date</th><th className="py-2.5 font-medium">Status</th><th className="py-2.5 px-1 font-medium text-right">Total</th></tr></thead><tbody>{o.recent.map(r => <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50"><td className="py-2.5 px-1"><span className="font-bold text-foreground">#{r.order_number}</span><br /><span className="text-muted-foreground">{r.customer_name}</span></td><td className="pr-2 text-muted-foreground">{r.sellers?.business_name || '—'}</td><td className="pr-2 text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td><td className="pr-2"><span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${statusTone[r.status]}`}>{r.status}</span></td><td className="px-1 text-right font-bold text-foreground whitespace-nowrap">{money(Number(r.total) || 0)}</td></tr>)}</tbody></table></div>}
      </Panel>
      <Panel title="Low stock alerts" subtitle="Active products with 5 or fewer units">
        {o.lowStock.length === 0 ? <p className="text-sm text-muted-foreground py-10 text-center">All products are well stocked.</p> : <ul className="divide-y divide-border">{o.lowStock.slice(0, 8).map(p => <li key={p.id} className="py-2 flex justify-between gap-2 text-xs"><span className="text-foreground truncate">{p.name}</span><span className={`font-bold shrink-0 ${p.stock === 0 ? 'text-destructive' : 'text-chart-amber'}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span></li>)}</ul>}
      </Panel>
    </div>
  </div>;
}

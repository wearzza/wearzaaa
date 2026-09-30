import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Boxes, Clock3, RefreshCw, ShoppingBag, Store, Wallet } from 'lucide-react';
import { supabase, type OrderStatus, type ProductCategory, type SellerStatus } from '../../lib/supabase';

type OrderRow = { id: string; order_number: string; customer_name: string; total: number; status: OrderStatus; created_at: string; sellers?: { business_name: string } | null };
type SellerRow = { id: string; status: SellerStatus; business_name: string };
type ProductRow = { id: string; category: ProductCategory; categories?: ProductCategory[] | null; stock: number; is_active: boolean; name: string };
type Data = { orders: OrderRow[]; sellers: SellerRow[]; products: ProductRow[]; errors: string[] };
type Period = 7 | 30 | 90 | 365;
const money = (value: number) => `Rs. ${Math.round(value).toLocaleString()}`;
const count = (value: number) => value.toLocaleString();
const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const sellerStatuses: SellerStatus[] = ['approved', 'pending', 'rejected', 'banned'];
const categories: ProductCategory[] = ['men', 'women', 'kids', 'streetwear', 'old_money', 'budget'];
const labels: Record<ProductCategory, string> = { men: 'Men', women: 'Women', kids: 'Kids', streetwear: 'Streetwear', old_money: 'Old Money', budget: 'Budget' };
const statusColors = ['var(--chart-amber)', 'var(--chart-blue)', 'var(--chart-violet)', 'var(--chart-green)', 'var(--chart-red)'];
const sellerColors = ['var(--chart-green)', 'var(--chart-amber)', 'var(--chart-red)', 'var(--chart-slate)'];

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

function Distribution({ title, values, colors }: { title: string; values: { label: string; value: number }[]; colors: string[] }) {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  let progress = 0;
  const rings = values.map((item, index) => {
    const length = total ? item.value / total * 100 : 0;
    const segment = { ...item, color: colors[index], offset: progress, length };
    progress += length;
    return segment;
  });
  return <section className="analytics-panel">
    <div className="analytics-panel-heading"><h2>{title}</h2><span>{count(total)} total</span></div>
    <div className="flex flex-col sm:flex-row items-center gap-6 py-3">
      <div className="relative w-36 h-36 shrink-0" role="img" aria-label={`${title}: ${values.map(v => `${v.label} ${v.value}`).join(', ')}`}>
        <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--chart-track)" strokeWidth="5" />
          {rings.map(item => <circle key={item.label} cx="21" cy="21" r="15.9" fill="none" stroke={item.color} strokeWidth="5" strokeDasharray={`${item.length} ${100 - item.length}`} strokeDashoffset={-item.offset} />)}
        </svg>
        <div className="absolute inset-0 flex flex-col justify-center items-center"><strong className="text-2xl text-foreground">{count(total)}</strong><span className="text-xs text-muted-foreground">total</span></div>
      </div>
      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3">
        {rings.map(item => <div key={item.label} className="min-w-0"><div className="flex items-center gap-2 text-xs text-muted-foreground capitalize"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />{item.label}</div><div className="pl-4 text-sm font-bold text-foreground">{count(item.value)} <span className="font-normal text-muted-foreground">{total ? Math.round(item.length) : 0}%</span></div></div>)}
      </div>
    </div>
  </section>;
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
      fetchRows<OrderRow>('orders', 'id,order_number,customer_name,total,status,created_at,sellers(business_name)'),
      fetchRows<SellerRow>('sellers', 'id,status,business_name'),
      fetchRows<ProductRow>('products', 'id,category,categories,stock,is_active,name'),
    ]).then(results => {
      if (!active) return;
      const names = ['Orders', 'Sellers', 'Products'];
      const errors = results.flatMap((result, index) => result.status === 'rejected' ? [names[index]] : []);
      setData({
        orders: results[0].status === 'fulfilled' ? results[0].value : [],
        sellers: results[1].status === 'fulfilled' ? results[1].value : [],
        products: results[2].status === 'fulfilled' ? results[2].value : [],
        errors,
      });
      setLoading(false);
    });
    return () => { active = false; };
  }, [reload]);

  const overview = useMemo(() => {
    if (!data) return null;
    const now = Date.now();
    const start = now - period * 86400000;
    const previousStart = start - period * 86400000;
    const current = data.orders.filter(order => new Date(order.created_at).getTime() >= start);
    const previous = data.orders.filter(order => { const time = new Date(order.created_at).getTime(); return time >= previousStart && time < start; });
    const revenue = (rows: OrderRow[]) => rows.filter(order => order.status === 'delivered').reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const currentRevenue = revenue(current);
    const priorRevenue = revenue(previous);
    const bucketCount = period === 7 ? 7 : period === 365 ? 12 : period === 90 ? 12 : 10;
    const bucketWidth = period * 86400000 / bucketCount;
    const trend = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = start + index * bucketWidth;
      const bucketEnd = bucketStart + bucketWidth;
      const rows = current.filter(order => { const date = new Date(order.created_at).getTime(); return date >= bucketStart && date < bucketEnd; });
      const label = new Date(bucketStart).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' });
      return { label, orders: rows.length, revenue: revenue(rows) };
    });
    const orderDistribution = statuses.map(status => ({ label: status, value: current.filter(order => order.status === status).length }));
    const sellerDistribution = sellerStatuses.map(status => ({ label: status, value: data.sellers.filter(seller => seller.status === status).length }));
    const categoryDistribution = categories.map(category => ({ label: labels[category], value: data.products.filter(product => product.categories?.length ? product.categories.includes(category) : product.category === category).length }));
    return { current, previous, currentRevenue, priorRevenue, trend, orderDistribution, sellerDistribution, categoryDistribution, activeProducts: data.products.filter(product => product.is_active).length, lowStock: data.products.filter(product => product.is_active && product.stock <= 5).length, recent: [...data.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8) };
  }, [data, period]);

  if (loading) return <div className="analytics-shell"><h1 className="analytics-title">Operations overview</h1><div className="analytics-panel py-16 text-center text-muted-foreground" role="status">Loading store activity…</div></div>;
  if (!data || !overview) return <div className="analytics-panel">Overview unavailable. <button onClick={() => setReload(value => value + 1)} className="text-primary underline">Retry</button></div>;

  const metrics = [
    { label: 'Delivered revenue', value: money(overview.currentRevenue), context: `${money(overview.priorRevenue)} previous period`, icon: Wallet, change: overview.currentRevenue - overview.priorRevenue },
    { label: 'Orders', value: count(overview.current.length), context: `${count(overview.previous.length)} previous period`, icon: ShoppingBag, change: overview.current.length - overview.previous.length },
    { label: 'Sellers', value: count(data.sellers.length), context: `${count(data.sellers.filter(s => s.status === 'pending').length)} awaiting review`, icon: Store, change: null },
    { label: 'Active products', value: count(overview.activeProducts), context: `${count(overview.lowStock)} low stock (≤5)`, icon: Boxes, change: null },
  ];
  const maxRevenue = Math.max(1, ...overview.trend.map(item => item.revenue));
  const maxOrders = Math.max(1, ...overview.trend.map(item => item.orders));
  const points = overview.trend.map((item, i) => `${24 + i * (552 / Math.max(1, overview.trend.length - 1))},${170 - item.revenue / maxRevenue * 135}`).join(' ');
  return <div className="analytics-shell">
    <header className="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div><p className="text-xs font-bold uppercase text-primary mb-1">Wearza / admin</p><h1 className="analytics-title">Operations overview</h1><p className="text-sm text-muted-foreground mt-1">Store performance and live activity</p></div>
      <div className="flex items-center gap-2"><div className="inline-flex rounded border border-border bg-card p-1" aria-label="Reporting period">{([7, 30, 90, 365] as Period[]).map(day => <button key={day} onClick={() => setPeriod(day)} aria-pressed={period === day} className={`px-2.5 py-1.5 text-xs font-bold rounded-sm ${period === day ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{day === 365 ? '1Y' : `${day}D`}</button>)}</div><button onClick={() => setReload(value => value + 1)} title="Refresh data" aria-label="Refresh data" className="analytics-icon-button"><RefreshCw size={16} /></button></div>
    </header>
    {data.errors.length > 0 && <div role="alert" className="flex items-center gap-2 border border-destructive/30 bg-destructive/10 text-destructive rounded p-3 mb-4 text-sm"><AlertCircle size={17} /> Could not load {data.errors.join(', ').toLowerCase()}. Some figures may be incomplete. <button className="underline ml-auto" onClick={() => setReload(v => v + 1)}>Retry</button></div>}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 md:gap-3 mb-3">{metrics.map(metric => <section key={metric.label} className="analytics-panel min-w-0"><div className="flex items-center justify-between text-muted-foreground"><span className="text-xs font-semibold">{metric.label}</span><metric.icon size={16} /></div><div className="text-xl md:text-2xl font-bold text-foreground mt-3 break-words">{metric.value}</div><div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">{metric.change !== null && (metric.change >= 0 ? <ArrowUpRight size={13} className="text-chart-green" /> : <ArrowDownRight size={13} className="text-destructive" />)}<span>{metric.context}</span></div></section>)}</div>
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 mb-3">
      <section className="analytics-panel xl:col-span-3"><div className="analytics-panel-heading"><div><h2>Revenue trend</h2><p>Delivered order value · last {period} days</p></div><Activity size={17} className="text-primary" /></div><div className="relative mt-4 h-48 md:h-56 pl-12 pb-5"><div className="absolute inset-y-0 left-0 pb-5 w-11 flex flex-col justify-between text-right text-xs text-muted-foreground"><span>{money(maxRevenue)}</span><span>{money(maxRevenue / 2)}</span><span>0</span></div><svg viewBox="0 0 600 190" preserveAspectRatio="none" className="w-full h-full overflow-visible" role="img" aria-label={`Revenue trend: ${overview.trend.map(item => `${item.label} ${money(item.revenue)}`).join(', ')}`}><path d="M24 35H576 M24 102H576 M24 170H576" fill="none" stroke="var(--chart-track)" strokeWidth="1"/><polyline points={points} fill="none" stroke="var(--primary-chart)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />{overview.trend.map((item, index) => <circle key={index} cx={24 + index * (552 / Math.max(1, overview.trend.length - 1))} cy={170 - item.revenue / maxRevenue * 135} r="3.5" fill="var(--primary-chart)"><title>{item.label}: {money(item.revenue)}</title></circle>)}</svg><div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-muted-foreground"><span>{overview.trend[0]?.label}</span><span>{overview.trend[Math.floor(overview.trend.length / 2)]?.label}</span><span>{overview.trend[overview.trend.length - 1]?.label}</span></div></div>{overview.current.length === 0 && <p className="text-xs text-muted-foreground mt-2">No orders in this period.</p>}</section>
      <section className="analytics-panel xl:col-span-2"><div className="analytics-panel-heading"><div><h2>Order volume</h2><p>Orders placed · last {period} days</p></div><span className="text-sm font-bold text-foreground">{count(overview.current.length)}</span></div><div className="h-48 md:h-56 mt-4 flex items-end gap-1.5 border-b border-border pb-5">{overview.trend.map((item, index) => <div key={index} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1"><div className="w-full max-w-12 bg-chart-blue rounded-t-sm min-h-px" style={{ height: `${item.orders / maxOrders * 90}%` }} title={`${item.label}: ${item.orders} orders`} /><span className="text-xs text-muted-foreground hidden sm:block">{item.label.split(' ')[1]}</span></div>)}</div></section>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3"><Distribution title="Order status" values={overview.orderDistribution} colors={statusColors} /><Distribution title="Seller status" values={overview.sellerDistribution} colors={sellerColors} /></div>
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
      <section className="analytics-panel xl:col-span-2"><div className="analytics-panel-heading"><h2>Product categories</h2><span>{count(data.products.length)} products</span></div><div className="space-y-3 mt-5">{overview.categoryDistribution.map((item, i) => <div key={item.label}><div className="flex justify-between text-xs mb-1"><span className="text-foreground font-medium">{item.label}</span><span className="text-muted-foreground">{count(item.value)}</span></div><div className="h-2 bg-muted rounded-sm overflow-hidden"><div className="h-full rounded-sm" style={{ width: `${data.products.length ? item.value / data.products.length * 100 : 0}%`, backgroundColor: statusColors[i % statusColors.length] }} /></div></div>)}</div></section>
      <section className="analytics-panel xl:col-span-3"><div className="analytics-panel-heading"><h2>Recent orders</h2><Clock3 size={16} className="text-muted-foreground" /></div>{overview.recent.length === 0 ? <p className="text-sm text-muted-foreground py-12 text-center">No orders yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs min-w-[480px]"><thead className="text-muted-foreground border-b border-border"><tr><th className="py-3 font-medium">Order / customer</th><th className="py-3 font-medium">Store</th><th className="py-3 font-medium">Status</th><th className="py-3 font-medium text-right">Total</th></tr></thead><tbody>{overview.recent.map(order => <tr key={order.id} className="border-b border-border last:border-0"><td className="py-2.5 pr-2"><span className="font-bold text-foreground">#{order.order_number}</span><br/><span className="text-muted-foreground">{order.customer_name}</span></td><td className="pr-2 text-muted-foreground">{order.sellers?.business_name || '—'}</td><td className="pr-2 capitalize text-foreground">{order.status}</td><td className="text-right font-semibold text-foreground whitespace-nowrap">{money(Number(order.total) || 0)}</td></tr>)}</tbody></table></div>}</section>
    </div>
  </div>;
}

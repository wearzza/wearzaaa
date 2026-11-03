import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Order } from '../lib/supabase';
import { cancellationLabel, statusLabel } from '../lib/commerce';
import Button from './ui/Button';
import Dialog from './ui/Dialog';

const fmt = (d?: string | null) => d ? new Date(d).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' }) : null;

export function OrderTimeline({ order }: { order: Order }) {
  const steps = [
    { label: 'Order placed', at: order.created_at },
    { label: 'Confirmed by seller', at: order.confirmed_at },
    { label: 'Delivered', at: order.delivered_at },
    ...(order.status === 'cancelled' ? [{ label: `Cancelled by ${order.cancelled_by || 'seller'}`, at: order.cancelled_at }] : []),
  ];
  return <ol className="space-y-2 text-sm">{steps.map(s => <li key={s.label} className="flex justify-between gap-3"><span className={s.at ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span><span className="text-xs text-muted-foreground text-right">{fmt(s.at) || 'Not yet'}</span></li>)}
    <li className="flex justify-between gap-3"><span className="text-muted-foreground">Last updated</span><span className="text-xs text-muted-foreground">{fmt(order.updated_at)}</span></li></ol>;
}

export function OrderDetailsDialog({ order, sellerName, onClose }: { order: Order; sellerName?: string; onClose: () => void }) {
  const row = (k: string, v: unknown) => <p className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="font-medium text-right break-words min-w-0">{v as string || 'N/A'}</span></p>;
  return <Dialog title={`Order #${order.order_number}`} onClose={onClose}>
    <div className="max-h-[70vh] overflow-y-auto space-y-4 text-sm">
      <section><h3 className="font-bold mb-2">Status: {statusLabel(order.status)}</h3><OrderTimeline order={order} /></section>
      <section className="border-t border-border pt-3 space-y-1"><h3 className="font-bold mb-1">Customer</h3>{row('Name', order.customer_name)}{row('Phone', order.customer_phone)}{row('Address', order.customer_address)}{row('Location', `${order.municipality || ''}-${order.ward_number || ''}, ${order.district || ''}, ${order.province || ''}`)}{order.map_url && <a href={order.map_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">View on Google Maps</a>}{sellerName && row('Seller', sellerName)}</section>
      <section className="border-t border-border pt-3 space-y-2"><h3 className="font-bold">Products</h3>{order.order_items?.map(i => <div key={i.id} className="flex items-center gap-2">{i.product_image && <img src={i.product_image} alt="" className="w-10 h-10 rounded-md object-cover" />}<div className="flex-1 min-w-0"><p className="font-medium break-words">{i.product_name}</p><p className="text-xs text-muted-foreground">Qty {i.quantity} × Rs. {i.unit_price}{i.selected_size ? ` · Size ${i.selected_size}` : ''}</p></div><span className="font-bold">Rs. {i.total_price}</span></div>)}</section>
      <section className="border-t border-border pt-3 space-y-1"><h3 className="font-bold mb-1">Payment</h3>{row('Subtotal', `Rs. ${Number(order.subtotal).toLocaleString()}`)}{order.promo_discount > 0 && row(`Discount (${order.promo_code})`, `-Rs. ${order.promo_discount}`)}{row('Total', `Rs. ${Number(order.total).toLocaleString()}`)}{row('Method', 'Cash on Delivery')}</section>
      {order.notes && <section className="border-t border-border pt-3"><h3 className="font-bold mb-1">Notes</h3><p className="break-words">{order.notes}</p></section>}
      {order.status === 'cancelled' && <section className="border-t border-border pt-3"><h3 className="font-bold mb-1">Cancellation</h3><p>{cancellationLabel(order.cancellation_reason)}</p>{order.cancellation_details && <p className="text-muted-foreground break-words">{order.cancellation_details}</p>}</section>}
    </div>
  </Dialog>;
}

export function OrderSearch({ onSearch }: { onSearch: (number: string) => Promise<string | null> }) {
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  async function go(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    const n = q.trim().replace(/^#/, '').toUpperCase();
    if (n) setMsg((await onSearch(n)) || '');
  }
  return <form onSubmit={go} className="mb-5"><div className="flex gap-2"><input value={q} onChange={e => setQ(e.target.value)} aria-label="Order number" placeholder="Paste order number e.g. WZ-261103-AB12CD" className="flex-1 min-w-0 px-3 py-2 rounded-md border border-border bg-card text-sm" /><Button type="submit" className="shrink-0"><Search size={14} />Search order</Button></div>{msg && <p role="alert" className="text-xs text-destructive mt-2">{msg}</p>}</form>;
}

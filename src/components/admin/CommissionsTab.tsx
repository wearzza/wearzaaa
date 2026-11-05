import { useEffect, useMemo, useState } from 'react';
import { supabase, Seller } from '../../lib/supabase';
import { commissionBalance } from '../../lib/commerce';
import { CommissionPayment, loadQr, readImage, saveQr } from '../../lib/commissionPayments';
import Button from '../ui/Button';
import { Check, X, MessageSquare, Upload } from 'lucide-react';

const tone = { pending: 'bg-chart-amber/15 text-chart-amber', approved: 'bg-chart-green/15 text-chart-green', rejected: 'bg-destructive/10 text-destructive' };

export default function CommissionsTab() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [orders, setOrders] = useState<{ seller_id: string; total: number; status: any }[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [qr, setQr] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [view, setView] = useState<CommissionPayment | null>(null);
  const [msgTo, setMsgTo] = useState<Seller | null>(null);
  const [msgText, setMsgText] = useState('');
  const [info, setInfo] = useState('');

  async function load() {
    const [s, o, p, q] = await Promise.all([
      supabase.from('sellers').select('*').order('business_name'),
      supabase.from('orders').select('seller_id,total,status').eq('status', 'delivered').range(0, 49999),
      supabase.from('commission_payments').select('*').order('created_at', { ascending: false }),
      loadQr(),
    ]);
    setSellers(s.data || []); setOrders(o.data || []); setPayments((p.data || []) as CommissionPayment[]); setQr(q);
  }
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => sellers.map(s => ({ s, ...commissionBalance(orders.filter(o => o.seller_id === s.id), payments.filter(p => p.seller_id === s.id)) })).filter(r => r.owed > 0 || r.pending > 0).sort((a, b) => b.due - a.due), [sellers, orders, payments]);
  const totals = rows.reduce((t, r) => ({ owed: t.owed + r.owed, paid: t.paid + r.paid, due: t.due + r.due, pending: t.pending + r.pending }), { owed: 0, paid: 0, due: 0, pending: 0 });
  const name = (id: string) => sellers.find(s => s.id === id)?.business_name || 'Unknown shop';
  const shown = payments.filter(p => filter === 'all' || p.status === 'pending');

  async function review(p: CommissionPayment, status: 'approved' | 'rejected') {
    const admin_note = status === 'rejected' ? window.prompt('Reason for rejecting (seller will see this):') || 'Payment could not be verified' : null;
    const { error } = await supabase.from('commission_payments').update({ status, admin_note, reviewed_at: new Date().toISOString() }).eq('id', p.id);
    if (error) return setInfo('Could not update payment.');
    await supabase.from('notifications').insert({ seller_id: p.seller_id, title: status === 'approved' ? 'Commission payment approved' : 'Commission payment rejected', message: status === 'approved' ? `Your payment of Rs. ${p.amount} was received. Thank you!` : `Your payment of Rs. ${p.amount} was rejected: ${admin_note}` });
    setView(null); load();
  }

  async function sendMessage() {
    if (!msgTo || !msgText.trim()) return;
    const { error } = await supabase.from('notifications').insert({ seller_id: msgTo.id, title: 'Message from Wearza admin', message: msgText.trim() });
    setInfo(error ? 'Message not sent.' : `Message sent to ${msgTo.business_name}.`);
    setMsgTo(null); setMsgText('');
  }

  const openMessage = (s: Seller, due: number) => { setMsgTo(s); setMsgText(due > 0 ? `Hello ${s.business_name}, your Wearza commission of Rs. ${due.toLocaleString()} is due. Please pay using the QR in "Pay Commission" and upload the screenshot.` : ''); };
  const waLink = (s: Seller, due: number) => `https://wa.me/977${String(s.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${s.business_name}, your Wearza commission of Rs. ${due} is due. Please pay via the QR in your seller panel.`)}`;

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-foreground">Commission Payments</h1><p className="text-sm text-muted-foreground">Review seller payment screenshots, track dues and message sellers.</p></div>
      {info && <p className="text-sm rounded-lg bg-muted px-3 py-2 text-foreground">{info}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Total commission', totals.owed], ['Received', totals.paid], ['Waiting review', totals.pending], ['Total due', totals.due]].map(([l, v], i) => (
          <div key={l as string} className={`rounded-2xl border p-4 ${i === 3 ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}><p className="text-xs text-muted-foreground">{l}</p><p className={`text-xl font-black ${i === 3 ? 'text-primary' : 'text-foreground'}`}>Rs. {Math.round(Number(v)).toLocaleString()}</p></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3"><h2 className="font-bold text-foreground">Payment screenshots</h2>
            <div className="flex gap-1">{(['pending', 'all'] as const).map(f => <Button key={f} variant={filter === f ? 'primary' : 'outline'} onClick={() => setFilter(f)} className="text-xs px-3 py-1.5 capitalize">{f}</Button>)}</div></div>
          {shown.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No {filter === 'pending' ? 'pending ' : ''}payments.</p> : (
            <div className="divide-y divide-border">
              {shown.map(p => (
                <div key={p.id} className="py-3 flex items-center gap-3">
                  <button onClick={() => setView(p)}><img src={p.screenshot_url} alt="Payment screenshot" className="w-14 h-14 rounded-lg object-cover bg-muted" /></button>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-foreground truncate">{name(p.seller_id)} • Rs. {Number(p.amount).toLocaleString()}</p><p className="text-xs text-muted-foreground truncate">{new Date(p.created_at).toLocaleString()}{p.reference ? ` • Txn ${p.reference}` : ''}</p></div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${tone[p.status]}`}>{p.status}</span>
                  <Button variant="outline" onClick={() => setView(p)} className="text-xs px-3 py-1.5">View</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-bold text-foreground mb-3">Payment QR shown to sellers</h2>
          {qr ? <img src={qr} alt="Payment QR" className="w-full max-w-[220px] mx-auto rounded-xl border border-border" /> : <p className="text-sm text-muted-foreground mb-2">No QR uploaded yet.</p>}
          <label className="mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-3 cursor-pointer hover:bg-muted text-sm font-semibold text-foreground">
            <Upload size={16} /> {qr ? 'Change QR' : 'Upload QR'}
            <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { const v = await readImage(f); const { error } = await saveQr(v); if (error) throw error; setQr(v); setInfo('QR saved. Sellers can now see it.'); } catch (err: any) { setInfo(err.message || 'QR not saved.'); } }} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 min-w-0">
        <h2 className="font-bold text-foreground mb-3">Dues by seller</h2>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No commission yet — appears once orders are delivered.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Shop</th><th>Commission</th><th>Paid</th><th>Waiting</th><th>Due</th><th className="text-right">Contact</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.s.id} className="border-b border-border last:border-0">
                <td className="py-2.5"><p className="font-semibold text-foreground">{r.s.business_name}</p><p className="text-xs text-muted-foreground">{r.s.full_name} • {r.s.phone}</p></td>
                <td>Rs. {r.owed.toLocaleString()}</td><td>Rs. {r.paid.toLocaleString()}</td><td>Rs. {r.pending.toLocaleString()}</td>
                <td className={`font-bold ${r.due > 0 ? 'text-primary' : 'text-chart-green'}`}>{r.due > 0 ? `Rs. ${r.due.toLocaleString()}` : 'Cleared'}</td>
                <td className="text-right whitespace-nowrap"><Button variant="outline" onClick={() => openMessage(r.s, r.due)} className="text-xs px-2.5 py-1.5"><MessageSquare size={13} /> Message</Button>{' '}<a href={waLink(r.s, r.due)} target="_blank" rel="noreferrer" className="inline-flex text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border hover:bg-muted text-foreground">WhatsApp</a></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>

      {view && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setView(null)}>
          <div className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-foreground">{name(view.seller_id)}</h3><p className="text-sm text-muted-foreground">Rs. {Number(view.amount).toLocaleString()} • {new Date(view.created_at).toLocaleString()}</p></div><button aria-label="Close" onClick={() => setView(null)}><X size={18} /></button></div>
            <img src={view.screenshot_url} alt="Payment screenshot" className="w-full rounded-xl border border-border mb-3" />
            {view.reference && <p className="text-sm text-foreground">Transaction ID: <b>{view.reference}</b></p>}
            {view.note && <p className="text-sm text-foreground">Note: {view.note}</p>}
            {(() => { const s = sellers.find(x => x.id === view.seller_id); return s && <p className="text-sm text-muted-foreground mt-1">{s.full_name} • {s.phone} • {s.email}</p>; })()}
            {view.admin_note && <p className="text-sm text-muted-foreground mt-1">Admin note: {view.admin_note}</p>}
            {view.status === 'pending' && <div className="flex gap-2 mt-4"><Button onClick={() => review(view, 'approved')} className="flex-1"><Check size={15} /> Approve</Button><Button variant="danger" onClick={() => review(view, 'rejected')} className="flex-1"><X size={15} /> Reject</Button></div>}
          </div>
        </div>
      )}

      {msgTo && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setMsgTo(null)}>
          <div className="bg-card rounded-2xl max-w-md w-full p-5" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="font-bold text-foreground mb-2">Message {msgTo.business_name}</h3>
            <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={4} maxLength={500} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <p className="text-xs text-muted-foreground mb-3">Shows in the seller's Notifications.</p>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setMsgTo(null)} className="flex-1">Cancel</Button><Button onClick={sendMessage} className="flex-1">Send</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

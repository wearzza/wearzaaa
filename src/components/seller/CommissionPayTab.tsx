import { useEffect, useState } from 'react';
import { supabase, Seller } from '../../lib/supabase';
import { commissionBalance } from '../../lib/commerce';
import { CommissionPayment, loadQr, readImage } from '../../lib/commissionPayments';
import Button from '../ui/Button';
import { Upload, QrCode } from 'lucide-react';

const tone = { pending: 'bg-chart-amber/15 text-chart-amber', approved: 'bg-chart-green/15 text-chart-green', rejected: 'bg-destructive/10 text-destructive' };

export default function CommissionPayTab({ seller }: { seller: Seller }) {
  const [qr, setQr] = useState('');
  const [orders, setOrders] = useState<{ total: number; status: any }[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [shot, setShot] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [q, o, p] = await Promise.all([
      loadQr(),
      supabase.from('orders').select('total,status').eq('seller_id', seller.id).eq('status', 'delivered').range(0, 9999),
      supabase.from('commission_payments').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }),
    ]);
    setQr(q); setOrders(o.data || []); setPayments((p.data || []) as CommissionPayment[]);
  }
  useEffect(() => { load(); }, [seller.id]);

  const bal = commissionBalance(orders, payments);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const amt = Number(amount);
    if (!(amt > 0)) return setMsg({ ok: false, t: 'Enter the amount you paid.' });
    if (!shot) return setMsg({ ok: false, t: 'Attach the payment screenshot.' });
    setBusy(true);
    const { error } = await supabase.from('commission_payments').insert({ seller_id: seller.id, amount: amt, screenshot_url: shot, reference: reference.trim() || null, note: note.trim() || null });
    setBusy(false);
    if (error) return setMsg({ ok: false, t: 'Could not send. Please try again.' });
    setAmount(''); setReference(''); setNote(''); setShot('');
    setMsg({ ok: true, t: 'Payment sent to Wearza. It will be marked paid after admin checks it.' });
    load();
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-foreground">Pay Commission</h1><p className="text-sm text-muted-foreground">Wearza takes 10% of each delivered order. Scan the QR, pay, then send the screenshot.</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Total commission', bal.owed], ['Approved paid', bal.paid], ['Waiting review', bal.pending], ['Due now', bal.due]].map(([l, v], i) => (
          <div key={l as string} className={`rounded-2xl border p-4 ${i === 3 ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
            <p className="text-xs text-muted-foreground">{l}</p><p className={`text-xl font-black ${i === 3 ? 'text-primary' : 'text-foreground'}`}>Rs. {Number(v).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <h2 className="font-bold text-foreground mb-3 flex items-center justify-center gap-2"><QrCode size={18} /> Scan to pay Wearza</h2>
          {qr ? <img src={qr} alt="Wearza payment QR code" className="mx-auto w-full max-w-[260px] rounded-xl border border-border" />
            : <div className="mx-auto max-w-[260px] aspect-square rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground p-4">The payment QR has not been added by admin yet.</div>}
          {qr && <a href={qr} download="wearza-qr.png" className="inline-block mt-3 text-sm font-semibold text-primary">Download QR</a>}
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-bold text-foreground">Send payment proof</h2>
          <label className="block text-sm font-medium text-foreground">Amount paid (Rs.)
            <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder={bal.due ? String(bal.due) : '0'} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <label className="block text-sm font-medium text-foreground">Transaction ID (optional)
            <input value={reference} onChange={e => setReference(e.target.value)} maxLength={80} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <label className="block text-sm font-medium text-foreground">Note (optional)
            <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={2} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:bg-muted text-sm text-muted-foreground">
            {shot ? <img src={shot} alt="Payment screenshot" className="max-h-48 rounded-lg" /> : <><Upload size={20} /> Attach payment screenshot</>}
            <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { setShot(await readImage(f)); } catch (err: any) { setMsg({ ok: false, t: err.message }); } }} />
          </label>
          {msg && <p className={`text-sm ${msg.ok ? 'text-chart-green' : 'text-destructive'}`}>{msg.t}</p>}
          <Button type="submit" disabled={busy} className="w-full py-3">{busy ? 'Sending…' : 'Send to Wearza'}</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold text-foreground mb-3">Payment history</h2>
        {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments sent yet.</p> : (
          <div className="divide-y divide-border">
            {payments.map(p => (
              <div key={p.id} className="py-3 flex items-center gap-3">
                <a href={p.screenshot_url} target="_blank" rel="noreferrer"><img src={p.screenshot_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted" /></a>
                <div className="flex-1 min-w-0"><p className="font-semibold text-foreground">Rs. {Number(p.amount).toLocaleString()}</p><p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}{p.admin_note ? ` • Admin: ${p.admin_note}` : ''}</p></div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${tone[p.status]}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

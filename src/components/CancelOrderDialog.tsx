import { useState } from 'react';
import type { Order } from '../lib/supabase';
import { CUSTOMER_REASONS, SELLER_REASONS, validCancellationReason } from '../lib/commerce';
import Button from './ui/Button';
import Dialog from './ui/Dialog';

export default function CancelOrderDialog({ order, actor, onClose, onConfirm }: { order: Order; actor: 'customer' | 'seller'; onClose: () => void; onConfirm: (reason: string, details: string) => Promise<void> }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const reasons = actor === 'customer' ? CUSTOMER_REASONS : SELLER_REASONS;
  async function submit() {
    if (!validCancellationReason(reason, details, actor)) return;
    setSaving(true); setError('');
    try { await onConfirm(reason, details.trim()); } catch (err) { setError(err instanceof Error ? err.message : 'Cancellation was not saved. Please try again.'); setSaving(false); }
  }
  return <Dialog title="Cancel order" onClose={() => { if (!saving) onClose(); }}>
    <p className="text-sm text-muted-foreground mb-4">#{order.order_number} · Rs. {Number(order.total).toLocaleString()}</p>
    <fieldset disabled={saving} className="space-y-2"><legend className="text-sm font-semibold mb-3">Why are you cancelling?</legend>{reasons.map(r => <label key={r.value} className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer text-sm ${reason === r.value ? 'border-primary bg-primary/5' : 'border-border'}`}><input type="radio" name="cancellation-reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-0.5 accent-primary" /><span>{r.label}</span></label>)}</fieldset>
    <label className="block text-sm font-semibold mt-4" htmlFor="cancellation-details">{reason === 'other' ? 'Details (required)' : 'Details (optional)'}</label>
    <textarea id="cancellation-details" value={details} onChange={e => setDetails(e.target.value)} maxLength={500} disabled={saving} rows={3} className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-primary" />
    <p className="text-xs text-muted-foreground mt-1 text-right">{details.length}/500</p>
    <p className="text-xs text-muted-foreground my-4">Cancellation is final. No payment is due for this Cash on Delivery order.{actor === 'customer' && ' Cancellation is available only before the seller confirms.'}</p>
    {error && <p role="alert" className="text-sm text-destructive mb-3">{error}</p>}
    <div className="flex flex-wrap gap-2 justify-end"><Button variant="outline" onClick={onClose} disabled={saving}>Keep order</Button><Button variant="danger" onClick={submit} disabled={saving || !validCancellationReason(reason, details, actor)}>{saving ? 'Cancelling…' : 'Confirm cancellation'}</Button></div>
  </Dialog>;
}
import { useState } from 'react';
import { Copy, Check, Share2, Instagram, Link2 } from 'lucide-react';
import { Seller } from '../../lib/supabase';
import { shopUrl } from '../../lib/catalog';

export default function ShopLinkCard({ seller }: { seller: Seller & { shop_slug?: string } }) {
  const [copied, setCopied] = useState(false);
  const url = shopUrl(seller);
  async function copy() {
    try { await navigator.clipboard.writeText(url); } catch {
      const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: seller.business_name, text: `Shop ${seller.business_name} on Wearza`, url }); return; } catch { /* cancelled */ } }
    copy();
  }
  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1"><Link2 size={16} className="text-primary" /><h2 className="font-bold text-foreground">Your shop link</h2></div>
      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5"><Instagram size={14} /> Put this in your Instagram / TikTok bio so customers land on your shop.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-muted text-sm font-semibold text-foreground truncate">{url.replace(/^https?:\/\//, '')}</div>
        <div className="flex gap-2">
          <button onClick={copy} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-foreground text-card text-sm font-bold">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy'}</button>
          <button onClick={share} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"><Share2 size={15} />Share</button>
        </div>
      </div>
      {seller.status !== 'approved' && <p className="text-xs text-muted-foreground mt-2">Your link starts working for customers once your shop is approved.</p>}
    </section>
  );
}

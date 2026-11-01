import { ShieldCheck } from 'lucide-react';
import { POLICY_VERSION, REFUND_POLICY, SELLER_TC } from '../../lib/sellerPolicies';

export default function SellerRules() {
  return <div className="max-w-3xl mx-auto text-foreground">
    <header className="border-b border-border pb-5 mb-5"><ShieldCheck className="text-primary mb-3" size={28} /><h1 className="analytics-title">Seller rules & policies</h1><p className="text-sm text-muted-foreground mt-2">Wearza · Effective {POLICY_VERSION} · 10% platform commission</p></header>
    {[{ title: 'Seller responsibilities', rules: SELLER_TC }, { title: 'Returns & refunds', rules: REFUND_POLICY }].map(section => <section key={section.title} className="mb-8"><h2 className="font-bold text-lg mb-4">{section.title}</h2><ol className="space-y-4">{section.rules.map((rule, i) => <li key={rule} className="flex gap-3 text-sm leading-relaxed"><span className="text-primary font-bold shrink-0 w-6">{i + 1}.</span><span>{rule}</span></li>)}</ol></section>)}
  </div>;
}
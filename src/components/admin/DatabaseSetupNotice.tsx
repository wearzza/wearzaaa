import { useState } from 'react';
import { Copy, Check, ExternalLink, Database, RefreshCw } from 'lucide-react';
import setupSql from '../../../supabase/sql/wearza_upgrade.sql?raw';
import { PUBLIC_SUPABASE_URL } from '../../lib/publicConfig';

const projectRef = PUBLIC_SUPABASE_URL.replace('https://', '').split('.')[0];

export default function DatabaseSetupNotice({ onRetry }: { onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(setupSql); } catch {
      const t = document.createElement('textarea'); t.value = setupSql; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <section role="alert" className="mb-5 rounded-2xl border border-destructive/30 bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0"><Database size={18} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground">Your store database is blocking Ban / Reject</h2>
          <p className="text-sm text-muted-foreground mt-1">Your database's security rules don't allow seller status changes yet. Allow it once, in about 1 minute:</p>
          <ol className="text-sm text-foreground mt-3 space-y-1.5 list-decimal pl-5">
            <li>Tap <b>Copy setup code</b>.</li>
            <li>Tap <b>Open SQL editor</b> and log in to the database account that holds your store.</li>
            <li>Paste the code, press <b>Run</b>, then come back and tap <b>Try again</b>.</li>
          </ol>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={copy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-card text-sm font-bold">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy setup code'}</button>
            <a href={`https://supabase.com/dashboard/project/${projectRef}/sql/new`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-bold text-foreground"><ExternalLink size={15} />Open SQL editor</a>
            <button onClick={onRetry} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-bold text-foreground"><RefreshCw size={15} />Try again</button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">This also turns on short shop links and lets you and your sellers add categories.</p>
        </div>
      </div>
    </section>
  );
}

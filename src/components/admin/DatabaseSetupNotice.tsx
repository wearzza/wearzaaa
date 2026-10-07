import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DatabaseSetupNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="mb-5 rounded-2xl border border-destructive/30 bg-card p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0"><AlertCircle size={18} /></div>
      <div className="min-w-0 flex-1">
        <h2 className="font-bold text-foreground">That change wasn't saved</h2>
        <p className="text-sm text-muted-foreground mt-1">Check your internet connection and try again.</p>
        <button onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-bold text-foreground"><RefreshCw size={15} />Try again</button>
      </div>
    </section>
  );
}

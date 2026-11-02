import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return <dialog ref={ref} onCancel={e => { e.preventDefault(); onClose(); }} aria-label={title} className="commerce-dialog w-[calc(100%_-_2rem)] max-w-lg rounded-lg border border-border bg-card p-5 text-foreground">
    <div className="mb-4 flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><Button variant="ghost" onClick={onClose} aria-label="Close dialog" className="h-8 w-8 shrink-0 p-0"><X size={18} /></Button></div>
    {children}
  </dialog>;
}
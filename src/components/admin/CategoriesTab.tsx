import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Category, refreshCategories, slugify } from '../../lib/catalog';
import DatabaseSetupNotice from './DatabaseSetupNotice';

export default function CategoriesTab() {
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ label: '', icon: '' });
  const [edits, setEdits] = useState<Record<string, { label: string; icon: string }>>({});
  const [blocked, setBlocked] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() { setCats(await refreshCategories(true)); }
  useEffect(() => { load(); }, []);

  function done(ok: boolean, text: string) {
    if (!ok) { setBlocked(true); return; }
    setBlocked(false); setMsg(text); setTimeout(() => setMsg(''), 2500);
    load(); refreshCategories();
  }

  async function add() {
    const label = form.label.trim().slice(0, 40);
    if (!label) return;
    const slug = slugify(label);
    if (cats.some(c => c.slug === slug)) { setMsg('That category already exists.'); return; }
    setBusy(true);
    const { data } = await supabase.from('categories').insert({ slug, label, icon: form.icon.trim().slice(0, 4) || '🏷️', sort_order: cats.length + 1, is_active: true }).select().maybeSingle();
    setBusy(false);
    if (data) setForm({ label: '', icon: '' });
    done(!!data, `${label} added.`);
  }
  async function update(c: Category, patch: Partial<Category>, text: string) {
    if (!c.id) return;
    const { data } = await supabase.from('categories').update(patch).eq('id', c.id).select().maybeSingle();
    done(!!data, text);
  }
  async function remove(c: Category) {
    if (!c.id || !window.confirm(`Delete "${c.label}"? Products already in it keep their other categories.`)) return;
    const { data } = await supabase.from('categories').delete().eq('id', c.id).select();
    done(!!data?.length, `${c.label} deleted.`);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black text-foreground mb-1">Categories</h1>
      <p className="text-sm text-muted-foreground mb-5">Add, rename, hide or delete the categories shown in the store. Sellers can also add their own.</p>
      {blocked && <DatabaseSetupNotice onRetry={() => setBlocked(false)} />}
      {msg && <p role="status" className="mb-4 rounded-xl border border-chart-green/30 bg-chart-green/10 p-3 text-sm text-foreground">{msg}</p>}

      <div className="rounded-2xl border border-border bg-card p-4 mb-5 flex flex-col sm:flex-row gap-2">
        <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🧥" aria-label="Icon" className="sm:w-16 px-3 py-2.5 rounded-xl border border-border text-center bg-card" />
        <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} onKeyDown={e => e.key === 'Enter' && add()} placeholder="New category name, e.g. Winter Wear" maxLength={40} className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary" />
        <button onClick={add} disabled={busy || !form.label.trim()} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"><Plus size={16} />Add</button>
      </div>

      <div className="space-y-2">
        {cats.map(c => {
          const e = edits[c.slug];
          return (
            <div key={c.slug} className={`rounded-2xl border border-border bg-card p-3 flex flex-wrap items-center gap-2 ${c.is_active === false ? 'opacity-60' : ''}`}>
              <input value={e?.icon ?? c.icon ?? ''} onChange={ev => setEdits({ ...edits, [c.slug]: { label: e?.label ?? c.label, icon: ev.target.value } })} aria-label="Icon" className="w-12 px-2 py-2 rounded-lg border border-border text-center bg-card" />
              <input value={e?.label ?? c.label} onChange={ev => setEdits({ ...edits, [c.slug]: { icon: e?.icon ?? c.icon ?? '', label: ev.target.value } })} aria-label="Name" className="flex-1 min-w-[8rem] px-3 py-2 rounded-lg border border-border text-sm bg-card" />
              {c.created_by_seller && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">by seller</span>}
              <div className="flex gap-1">
                {e && <button aria-label="Save" onClick={() => { update(c, { label: e.label.trim() || c.label, icon: e.icon }, 'Saved.'); setEdits(({ [c.slug]: _, ...rest }) => rest); }} className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Save size={15} /></button>}
                <button aria-label={c.is_active === false ? 'Show' : 'Hide'} onClick={() => update(c, { is_active: c.is_active === false }, c.is_active === false ? 'Now visible.' : 'Hidden from store.')} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-foreground">{c.is_active === false ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                <button aria-label="Delete" onClick={() => remove(c)} className="w-9 h-9 rounded-lg border border-destructive/30 text-destructive flex items-center justify-center"><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

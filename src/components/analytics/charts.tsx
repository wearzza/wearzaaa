import { useId, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

export type Point = { label: string; value: number };
export type Period = 7 | 30 | 90 | 365;

export const money = (v: number) => `Rs. ${Math.round(v).toLocaleString()}`;
export const compactMoney = (v: number) => `Rs. ${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.round(v))}`;
export const count = (v: number) => Math.round(v).toLocaleString();
export const pct = (cur: number, prev: number) => (prev ? ((cur - prev) / prev) * 100 : cur ? 100 : 0);
export const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

export function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm" aria-label="Reporting period">
    {([7, 30, 90, 365] as Period[]).map(d => <button key={d} onClick={() => onChange(d)} aria-pressed={value === d} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${value === d ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>{d === 365 ? '1Y' : `${d}D`}</button>)}
  </div>;
}

export function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`dash-panel ${className}`}>
    <div className="flex items-start justify-between gap-3 mb-4"><div className="min-w-0"><h2 className="text-sm font-bold text-foreground">{title}</h2>{subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}</div>{action}</div>
    {children}
  </section>;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const id = useId().replace(/:/g, '');
  if (data.length < 2) return null;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - (v / max) * 26}`);
  return <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-9" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    <polygon points={`0,30 ${pts.join(' ')} 100,30`} fill={`url(#${id})`} />
    <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
  </svg>;
}

export function KpiCard({ label, value, context, icon: Icon, delta, spark, color = 'var(--chart-1)' }: { label: string; value: string; context?: string; icon: LucideIcon; delta?: number | null; spark?: number[]; color?: string }) {
  return <section className="dash-panel min-w-0 flex flex-col">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-muted-foreground truncate">{label}</span>
      <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}><Icon size={16} /></span>
    </div>
    <div className="text-xl md:text-2xl font-extrabold text-foreground mt-2 break-words tracking-tight">{value}</div>
    <div className="flex items-center gap-1.5 text-xs mt-1 min-h-4">
      {delta !== undefined && delta !== null && <span className={`inline-flex items-center font-bold rounded-full px-1.5 py-0.5 ${delta >= 0 ? 'text-chart-green bg-chart-green/10' : 'text-destructive bg-destructive/10'}`}>{delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(delta).toFixed(0)}%</span>}
      {context && <span className="text-muted-foreground truncate">{context}</span>}
    </div>
    {spark && <div className="mt-auto pt-2"><Sparkline data={spark} color={color} /></div>}
  </section>;
}

export function AreaChart({ data, format = count, color = 'var(--chart-1)', compare }: { data: Point[]; format?: (v: number) => string; color?: string; compare?: number[] }) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const W = 600, H = 220, P = 8;
  const max = Math.max(1, ...data.map(d => d.value), ...(compare || []));
  const x = (i: number) => P + (i * (W - P * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - 24 - (v / max) * (H - 44);
  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const h = hover !== null ? data[hover] : null;
  return <div className="relative">
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-52 md:h-60" role="img" aria-label={data.map(d => `${d.label} ${format(d.value)}`).join(', ')} onMouseLeave={() => setHover(null)}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.32" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, 0.25, 0.5, 0.75, 1].map(t => <line key={t} x1={P} x2={W - P} y1={y(max * t)} y2={y(max * t)} stroke="var(--chart-track)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />)}
      {compare && compare.length > 1 && <polyline points={compare.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke="var(--chart-slate)" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />}
      <polygon points={`${x(0)},${H - 24} ${line} ${x(data.length - 1)},${H - 24}`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={10} y2={H - 24} stroke={color} strokeOpacity="0.4" vectorEffect="non-scaling-stroke" />}
      {data.map((d, i) => <rect key={i} x={x(i) - (W / data.length) / 2} y={0} width={W / data.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />)}
      {hover !== null && <circle cx={x(hover)} cy={y(data[hover].value)} r="5" fill="hsl(var(--card))" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />}
    </svg>
    {h && <div className="absolute top-1 pointer-events-none rounded-lg border border-border bg-card shadow-lg px-3 py-2 text-xs" style={{ left: `clamp(0px, calc(${(x(hover!) / W) * 100}% - 60px), calc(100% - 130px))` }}><div className="text-muted-foreground">{h.label}</div><div className="font-bold text-foreground">{format(h.value)}</div></div>}
    <div className="flex justify-between text-[11px] text-muted-foreground -mt-4 px-1">{[0, Math.floor(data.length / 2), data.length - 1].map(i => <span key={i}>{data[i]?.label}</span>)}</div>
  </div>;
}

export function BarChart({ data, color = 'var(--chart-2)', format = count }: { data: Point[]; color?: string; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return <div className="h-52 md:h-60 flex items-end gap-1 sm:gap-1.5">
    {data.map((d, i) => <div key={i} className="group flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1" title={`${d.label}: ${format(d.value)}`}>
      <span className="text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">{format(d.value)}</span>
      <div className="w-full max-w-10 rounded-t-md transition-all group-hover:opacity-80" style={{ height: `${Math.max(1.5, (d.value / max) * 82)}%`, background: `linear-gradient(to top, ${color}, color-mix(in srgb, ${color} 55%, transparent))` }} />
      <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.label.split(' ').pop()}</span>
    </div>)}
  </div>;
}

export function Donut({ values, colors = PALETTE, centerLabel = 'total' }: { values: Point[]; colors?: string[]; centerLabel?: string }) {
  const total = values.reduce((s, v) => s + v.value, 0);
  let acc = 0;
  return <div className="flex flex-col sm:flex-row items-center gap-5">
    <div className="relative w-36 h-36 shrink-0" role="img" aria-label={values.map(v => `${v.label} ${v.value}`).join(', ')}>
      <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--chart-track)" strokeWidth="4.5" />
        {values.map((v, i) => { const len = total ? (v.value / total) * 100 : 0; const el = <circle key={v.label} cx="21" cy="21" r="15.9" fill="none" stroke={colors[i % colors.length]} strokeWidth="4.5" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={-acc} />; acc += len; return el; })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center"><strong className="text-2xl font-extrabold text-foreground">{count(total)}</strong><span className="text-[11px] text-muted-foreground">{centerLabel}</span></div>
    </div>
    <ul className="w-full grid grid-cols-2 gap-x-4 gap-y-2.5">
      {values.map((v, i) => <li key={v.label} className="min-w-0"><div className="flex items-center gap-2 text-xs text-muted-foreground capitalize"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} /><span className="truncate">{v.label}</span></div><div className="pl-[18px] text-sm font-bold text-foreground">{count(v.value)} <span className="font-normal text-xs text-muted-foreground">{total ? Math.round((v.value / total) * 100) : 0}%</span></div></li>)}
    </ul>
  </div>;
}

export function RankList({ items, format = count, empty = 'No data yet.' }: { items: (Point & { sub?: string })[]; format?: (v: number) => string; empty?: string }) {
  const max = Math.max(1, ...items.map(i => i.value));
  if (!items.length) return <p className="text-sm text-muted-foreground py-10 text-center">{empty}</p>;
  return <ol className="space-y-3">
    {items.map((it, i) => <li key={it.label + i}>
      <div className="flex items-center justify-between gap-2 text-xs mb-1"><span className="flex items-center gap-2 min-w-0"><span className="w-5 h-5 rounded-md bg-muted text-[10px] font-bold grid place-items-center shrink-0 text-foreground">{i + 1}</span><span className="font-semibold text-foreground truncate">{it.label}</span>{it.sub && <span className="text-muted-foreground truncate hidden sm:inline">{it.sub}</span>}</span><span className="font-bold text-foreground shrink-0">{format(it.value)}</span></div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} /></div>
    </li>)}
  </ol>;
}

export function Funnel({ steps }: { steps: Point[] }) {
  const max = Math.max(1, steps[0]?.value || 0, ...steps.map(s => s.value));
  return <div className="space-y-2">
    {steps.map((s, i) => <div key={s.label} className="flex items-center gap-3">
      <span className="w-20 text-xs text-muted-foreground capitalize shrink-0">{s.label}</span>
      <div className="flex-1 h-7 bg-muted rounded-md overflow-hidden"><div className="h-full rounded-md flex items-center px-2 text-[11px] font-bold text-primary-foreground" style={{ width: `${Math.max(6, (s.value / max) * 100)}%`, background: PALETTE[i % PALETTE.length] }}>{count(s.value)}</div></div>
      <span className="w-10 text-right text-xs font-semibold text-foreground">{steps[0]?.value ? Math.round((s.value / steps[0].value) * 100) : 0}%</span>
    </div>)}
  </div>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOTS = ['12a', '4a', '8a', '12p', '4p', '8p'];
export function Heatmap({ dates }: { dates: string[] }) {
  const grid = Array.from({ length: 7 }, () => Array(6).fill(0));
  dates.forEach(d => { const t = new Date(d); grid[t.getDay()][Math.floor(t.getHours() / 4)]++; });
  const max = Math.max(1, ...grid.flat());
  return <div className="overflow-x-auto"><table className="w-full border-separate" style={{ borderSpacing: 3 }}>
    <thead><tr><th />{SLOTS.map(s => <th key={s} className="text-[10px] font-medium text-muted-foreground">{s}</th>)}</tr></thead>
    <tbody>{grid.map((row, d) => <tr key={d}><td className="text-[10px] text-muted-foreground pr-1">{DAYS[d]}</td>{row.map((v, s) => <td key={s} title={`${DAYS[d]} ${SLOTS[s]}: ${v} orders`} className="h-6 rounded" style={{ background: v ? `color-mix(in srgb, var(--chart-1) ${15 + (v / max) * 85}%, transparent)` : 'hsl(var(--muted))' }} />)}</tr>)}</tbody>
  </table></div>;
}

/** Splits a period into buckets and aggregates rows by created_at. */
export function buckets<T extends { created_at: string }>(rows: T[], period: Period, offsetPeriods = 0, value: (r: T) => number = () => 1): Point[] {
  const n = period === 7 ? 7 : period === 30 ? 15 : 12;
  const end = Date.now() - offsetPeriods * period * 86400000;
  const start = end - period * 86400000;
  const w = (end - start) / n;
  const out = Array.from({ length: n }, (_, i) => ({ label: new Date(start + i * w).toLocaleDateString('en', period === 365 ? { month: 'short' } : { month: 'short', day: 'numeric' }), value: 0 }));
  rows.forEach(r => { const t = new Date(r.created_at).getTime(); if (t >= start && t < end) out[Math.min(n - 1, Math.floor((t - start) / w))].value += value(r); });
  return out;
}

export function inPeriod<T extends { created_at: string }>(rows: T[], period: Period, offsetPeriods = 0) {
  const end = Date.now() - offsetPeriods * period * 86400000, start = end - period * 86400000;
  return rows.filter(r => { const t = new Date(r.created_at).getTime(); return t >= start && t < end; });
}

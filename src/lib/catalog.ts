import { useEffect, useState } from 'react';
import { supabase, Product, Seller } from './supabase';

export interface Category { id?: string; slug: string; label: string; icon?: string; color?: string; sort_order?: number; is_active?: boolean; created_by_seller?: string | null }

export const DEFAULT_CATEGORIES: Category[] = [
  { slug: 'men', label: 'Men', icon: '👔' }, { slug: 'women', label: 'Women', icon: '👗' },
  { slug: 'kids', label: 'Kids', icon: '👶' }, { slug: 'streetwear', label: 'Streetwear', icon: '🧢' },
  { slug: 'old_money', label: 'Old Money', icon: '💼' }, { slug: 'budget', label: 'Budget Deals', icon: '💰' },
];

let cache: Category[] | null = null;
const listeners = new Set<(c: Category[]) => void>();

export async function refreshCategories(includeHidden = false) {
  let q = supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (!includeHidden) q = q.eq('is_active', true);
  const { data, error } = await q;
  const list = !error && data && data.length ? (data as Category[]) : DEFAULT_CATEGORIES;
  if (!includeHidden) { cache = list; listeners.forEach(l => l(list)); }
  return list;
}

export function useCategories() {
  const [cats, setCats] = useState<Category[]>(cache || DEFAULT_CATEGORIES);
  useEffect(() => { listeners.add(setCats); if (!cache) refreshCategories(); return () => { listeners.delete(setCats); }; }, []);
  return cats;
}

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
export const shopHandle = (s: Pick<Seller, 'id'> & { shop_slug?: string }) => s.shop_slug || s.id.slice(0, 8);
export const shopUrl = (s: Pick<Seller, 'id'> & { shop_slug?: string }) => `${window.location.origin}/s/${shopHandle(s)}`;

// ---------- Search ----------
const SYN: Record<string, string[]> = {
  tshirt: ['t-shirt', 'tee', 'tshirt'], tee: ['tshirt', 't-shirt'], pant: ['pants', 'trouser', 'jeans'], pants: ['pant', 'trouser'],
  jeans: ['denim', 'pant'], hoodie: ['hoody', 'sweatshirt'], dress: ['gown', 'frock'], shoe: ['shoes', 'sneaker', 'footwear'],
  sneaker: ['shoe', 'sneakers'], jacket: ['coat', 'blazer'], kurta: ['kurti'], kurti: ['kurta'], cap: ['hat'],
  boys: ['men', 'kids'], girls: ['women', 'kids'], ladies: ['women'], gents: ['men'], male: ['men'], female: ['women'], cheap: ['budget'],
};
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
function close(a: string, b: string) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function scoreProduct(p: Product, query: string, cats: Category[] = []) {
  const q = norm(query);
  if (!q) return 1;
  const name = norm(p.name), desc = norm(p.description || ''), shop = norm(p.sellers?.business_name || '');
  const catSlugs = (p.categories?.length ? p.categories : [p.category]) as string[];
  const catText = norm(catSlugs.map(c => `${c} ${cats.find(x => x.slug === c)?.label || ''}`).join(' '));
  const words = { name: name.split(' '), all: `${name} ${desc} ${shop} ${catText}`.split(' ') };
  let score = name.includes(q) ? 50 : 0;
  for (const t of q.split(' ')) {
    const variants = [t, t.replace(/s$/, ''), ...(SYN[t] || [])];
    let best = 0;
    for (const v of variants) {
      if (words.name.some(w => w.startsWith(v))) best = Math.max(best, 10);
      else if (catText.includes(v)) best = Math.max(best, 8);
      else if (shop.includes(v)) best = Math.max(best, 6);
      else if (desc.includes(v)) best = Math.max(best, 4);
      else if (words.all.some(w => close(w, v))) best = Math.max(best, 3);
    }
    if (!best) return 0;
    score += best;
  }
  return score + Math.min(p.avg_rating || 0, 5);
}

export function searchProducts(products: Product[], query: string, cats: Category[] = []) {
  return products.map(p => ({ p, s: scoreProduct(p, query, cats) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.p);
}

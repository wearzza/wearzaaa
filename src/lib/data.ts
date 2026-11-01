import { supabase } from './supabase';

export async function fetchAllRows<T>(table: string, columns = '*', sellerId?: string): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; ; start += 1000) {
    let query = supabase.from(table).select(columns).order('id').range(start, start + 999);
    if (sellerId) query = query.eq('seller_id', sellerId);
    const { data, error } = await query;
    if (error) throw error;
    const page = (data || []) as T[];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}
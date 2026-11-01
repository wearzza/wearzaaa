import { supabase, type Order } from './supabase';

export type TrackedOrder = { id: string; token: string; number: string };
const KEY = 'wearza_tracked_orders';
export function readTrackedOrders(): TrackedOrder[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((r): r is TrackedOrder => r && typeof r.id === 'string' && typeof r.token === 'string' && typeof r.number === 'string') : [];
  } catch { return []; }
}
export function saveTrackedOrder(order: TrackedOrder) {
  localStorage.setItem(KEY, JSON.stringify([order, ...readTrackedOrders().filter(r => r.id !== order.id)]));
}
export async function loadTrackedOrder(tracking: TrackedOrder): Promise<Order | null> {
  const { data, error } = await supabase.rpc('wearza_tracked_order', { _order_id: tracking.id, _token: tracking.token });
  if (error) throw error;
  return data as Order | null;
}
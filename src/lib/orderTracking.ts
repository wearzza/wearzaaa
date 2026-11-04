import { supabase, type Order } from './supabase';
import { readGuestOrders, saveGuestOrder, type TrackedOrder, type OrderLookup, normalizeOrderNumber } from './guestOrderStorage';
export type { TrackedOrder } from './guestOrderStorage';
export function readTrackedOrders(): TrackedOrder[] {
  try { return readGuestOrders(localStorage); } catch { return []; }
}
export function saveTrackedOrder(order: TrackedOrder) {
  saveGuestOrder(localStorage, order);
}
export async function loadTrackedOrder(tracking: TrackedOrder): Promise<Order | null> {
  const { data, error } = await supabase.rpc('wearza_tracked_order', { _order_id: tracking.id, _token: tracking.token });
  if (error) throw error;
  return data as Order | null;
}
export async function loadOrderLookup(lookup: OrderLookup): Promise<Order | null> {
  const { data, error } = await supabase.rpc('wearza_find_order', { _order_number: normalizeOrderNumber(lookup.number), _phone: lookup.phone });
  if (error) throw error;
  return data as Order | null;
}
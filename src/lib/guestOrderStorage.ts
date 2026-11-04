export type TrackedOrder = { id: string; token: string; number: string };
export type OrderLookup = { number: string; phone: string };
export const TRACKED_ORDERS_KEY = 'wearza_tracked_orders';
export const ORDER_LOOKUPS_KEY = 'wearza_order_lookups';

export function normalizeOrderNumber(value: string) {
  return value.trim().replace(/^#\s*/, '').toUpperCase();
}

function readArray(storage: Pick<Storage, 'getItem'>, key: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function readGuestOrders(storage: Pick<Storage, 'getItem'>): TrackedOrder[] {
  return readArray(storage, TRACKED_ORDERS_KEY).filter((value): value is TrackedOrder => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<TrackedOrder>;
    return typeof row.id === 'string' && typeof row.token === 'string' && typeof row.number === 'string';
  });
}

export function saveGuestOrder(storage: Pick<Storage, 'getItem' | 'setItem'>, order: TrackedOrder) {
  storage.setItem(TRACKED_ORDERS_KEY, JSON.stringify([order, ...readGuestOrders(storage).filter(row => row.id !== order.id)]));
}

export function readOrderLookups(storage: Pick<Storage, 'getItem'>): OrderLookup[] {
  return readArray(storage, ORDER_LOOKUPS_KEY).filter((value): value is OrderLookup => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<OrderLookup>;
    return typeof row.number === 'string' && typeof row.phone === 'string' && Boolean(row.number && row.phone);
  });
}

export function saveOrderLookup(storage: Pick<Storage, 'getItem' | 'setItem'>, lookup: OrderLookup) {
  const normalized = { number: normalizeOrderNumber(lookup.number), phone: lookup.phone.trim() };
  storage.setItem(ORDER_LOOKUPS_KEY, JSON.stringify([normalized, ...readOrderLookups(storage).filter(row => normalizeOrderNumber(row.number) !== normalized.number)]));
}

export function canManageGuestOrder(id: string, tracking: TrackedOrder[]) {
  return tracking.some(row => row.id === id && row.token.length >= 32);
}
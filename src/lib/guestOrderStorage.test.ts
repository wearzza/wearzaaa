import { describe, expect, test } from 'bun:test';
import { canManageGuestOrder, normalizeOrderNumber, ORDER_LOOKUPS_KEY, readGuestOrders, readOrderLookups, saveGuestOrder, saveOrderLookup, TRACKED_ORDERS_KEY } from './guestOrderStorage';

function deviceStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

describe('Guest orders without signup', () => {
  test('an order survives reopening My Orders on the same device without an account', () => {
    const storage = deviceStorage();
    const order = { id: 'order-one', number: 'WZ-261104-A1B2C3', token: 'a'.repeat(64) };
    saveGuestOrder(storage, order);
    expect(readGuestOrders(storage)).toEqual([order]);
    expect(canManageGuestOrder('order-one', readGuestOrders(storage))).toBe(true);
  });
  test('each separate order stays in My Orders; saving one twice does not duplicate it', () => {
    const storage = deviceStorage();
    const one = { id: 'one', number: 'WZ-261104-A1B2C3', token: 'a'.repeat(64) };
    const two = { id: 'two', number: 'WZ-261104-D4E5F6', token: 'b'.repeat(64) };
    saveGuestOrder(storage, one); saveGuestOrder(storage, two); saveGuestOrder(storage, one);
    expect(readGuestOrders(storage).map(order => order.number)).toEqual([one.number, two.number]);
  });
  test('a lookup persists for fresh tracking but never grants cancellation access', () => {
    const storage = deviceStorage();
    saveOrderLookup(storage, { number: ' #wz-261104-a1b2c3 ', phone: '9800000000' });
    expect(readOrderLookups(storage)).toEqual([{ number: 'WZ-261104-A1B2C3', phone: '9800000000' }]);
    expect(canManageGuestOrder('order-one', readGuestOrders(storage))).toBe(false);
  });
  test('damaged or non-array saved tracking does not break My Orders', () => {
    const storage = deviceStorage();
    storage.setItem(TRACKED_ORDERS_KEY, '{}'); storage.setItem(ORDER_LOOKUPS_KEY, 'null');
    expect(readGuestOrders(storage)).toEqual([]); expect(readOrderLookups(storage)).toEqual([]);
    storage.setItem(TRACKED_ORDERS_KEY, '[null,{},7]');
    expect(readGuestOrders(storage)).toEqual([]);
  });
  test('pasted order numbers support spaces, a hash and lowercase', () => {
    expect(normalizeOrderNumber('  # wz-261104-a1b2c3 ')).toBe('WZ-261104-A1B2C3');
  });
});
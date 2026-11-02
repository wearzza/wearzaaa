import { describe, expect, test } from 'bun:test';
import { canCustomerCancel, canChangeOrderStatus, COMMISSION_PERCENT, earningsSummary, orderEarnings, ORDER_STATUSES, validCancellationReason } from './commerce';

describe('Wearza commerce rules', () => {
  test('platform commission is 10% instead of 25%', () => {
    expect(COMMISSION_PERCENT).toBe(10);
    expect(orderEarnings(400)).toEqual({ sales: 400, commission: 40, sellerNet: 360 });
  });
  test('seller choices include pending, processing, confirmed, delivered and cancelled', () => {
    expect(ORDER_STATUSES).toEqual(['pending', 'processing', 'confirmed', 'delivered', 'cancelled']);
  });
  test('customer cancellation closes at confirmation', () => {
    expect(canCustomerCancel('pending')).toBe(true);
    expect(canCustomerCancel('processing')).toBe(true);
    expect(canCustomerCancel('confirmed')).toBe(false);
    expect(canCustomerCancel('shipped')).toBe(false);
    expect(canCustomerCancel('delivered')).toBe(false);
    expect(canCustomerCancel('cancelled')).toBe(false);
  });
  test('cancellation requires a valid reason and other requires an explanation', () => {
    expect(validCancellationReason('', '', 'customer')).toBe(false);
    expect(validCancellationReason('invalid', '', 'customer')).toBe(false);
    expect(validCancellationReason('changed_mind', '', 'customer')).toBe(true);
    expect(validCancellationReason('other', '', 'customer')).toBe(false);
    expect(validCancellationReason('other', 'Ordered by mistake', 'customer')).toBe(true);
  });
  test('confirmed orders cannot be reopened to bypass cancellation restrictions', () => {
    expect(canChangeOrderStatus('confirmed', 'pending')).toBe(false);
    expect(canChangeOrderStatus('confirmed', 'processing')).toBe(false);
    expect(canChangeOrderStatus('confirmed', 'delivered')).toBe(true);
    expect(canChangeOrderStatus('delivered', 'pending')).toBe(false);
  });
  test('processing and confirmed orders advance without skipping confirmation or reopening delivery', () => {
    expect(canChangeOrderStatus('pending', 'delivered')).toBe(false);
    expect(canChangeOrderStatus('processing', 'delivered')).toBe(false);
    expect(canChangeOrderStatus('processing', 'confirmed')).toBe(true);
    expect(canChangeOrderStatus('confirmed', 'shipped')).toBe(false);
    expect(canChangeOrderStatus('shipped', 'confirmed')).toBe(false);
    expect(canChangeOrderStatus('shipped', 'delivered')).toBe(true);
    expect(canChangeOrderStatus('delivered', 'cancelled')).toBe(false);
  });
  test('only delivered orders earn commission and paid versus due remains separate', () => {
    expect(earningsSummary([
      { total: 400, status: 'delivered', commission_paid: false },
      { total: 600, status: 'delivered', commission_paid: true },
      { total: 800, status: 'pending', commission_paid: false },
      { total: 900, status: 'cancelled', commission_paid: false },
    ])).toEqual({ sales: 1000, commission: 100, sellerNet: 900, delivered: 2, paid: 60, due: 40 });
  });
});
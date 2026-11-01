import type { Order, OrderStatus } from './supabase';

export const COMMISSION_PERCENT = 10;
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'confirmed', 'delivered', 'cancelled'];
export const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'bg-chart-amber/15 text-chart-amber', processing: 'bg-chart-violet/15 text-chart-violet',
  confirmed: 'bg-chart-blue/15 text-chart-blue', shipped: 'bg-chart-blue/15 text-chart-blue',
  delivered: 'bg-chart-green/15 text-chart-green', cancelled: 'bg-destructive/10 text-destructive',
};
export const CUSTOMER_REASONS = [
  { value: 'changed_mind', label: 'I changed my mind' },
  { value: 'wrong_size', label: 'I ordered the wrong size or item' },
  { value: 'wrong_address', label: 'I need to change the delivery address' },
  { value: 'duplicate', label: 'I placed a duplicate order' },
  { value: 'delivery_time', label: 'The delivery time does not suit me' },
  { value: 'other', label: 'Other reason' },
] as const;
export const SELLER_REASONS = [
  { value: 'out_of_stock', label: 'Item is out of stock' },
  { value: 'cannot_deliver', label: 'Unable to deliver to this address' },
  { value: 'customer_request', label: 'Customer requested cancellation' },
  { value: 'other', label: 'Other reason' },
] as const;
export const canCustomerCancel = (status: OrderStatus) => status === 'pending' || status === 'processing';
export const statusLabel = (status: OrderStatus) => status === 'shipped' ? 'Confirmed' : status.charAt(0).toUpperCase() + status.slice(1);
export function canChangeOrderStatus(from: OrderStatus, to: OrderStatus) {
  if (from === to) return true;
  if (from === 'delivered' || from === 'cancelled') return false;
  if (to === 'cancelled') return true;
  if (from === 'pending') return to === 'processing' || to === 'confirmed';
  if (from === 'processing') return to === 'confirmed';
  return to === 'delivered';
}
export function validCancellationReason(reason: string, details: string, actor: 'customer' | 'seller') {
  const choices = actor === 'customer' ? CUSTOMER_REASONS : SELLER_REASONS;
  return choices.some(r => r.value === reason) && details.length <= 500 && (reason !== 'other' || details.trim().length >= 5);
}
export const cancellationLabel = (reason?: string | null) => [...CUSTOMER_REASONS, ...SELLER_REASONS].find(r => r.value === reason)?.label || reason || 'Not specified';
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function orderEarnings(total: number) {
  const sales = Number(total) || 0;
  const commission = round(sales * COMMISSION_PERCENT / 100);
  return { sales, commission, sellerNet: round(sales - commission) };
}
export function earningsSummary(orders: Pick<Order, 'total' | 'status' | 'commission_paid'>[]) {
  return orders.reduce((summary, order) => {
    if (order.status !== 'delivered') return summary;
    const earnings = orderEarnings(order.total);
    summary.sales = round(summary.sales + earnings.sales);
    summary.commission = round(summary.commission + earnings.commission);
    summary.sellerNet = round(summary.sellerNet + earnings.sellerNet);
    summary.delivered++;
    if (order.commission_paid) summary.paid = round(summary.paid + earnings.commission);
    else summary.due = round(summary.due + earnings.commission);
    return summary;
  }, { sales: 0, commission: 0, sellerNet: 0, delivered: 0, paid: 0, due: 0 });
}
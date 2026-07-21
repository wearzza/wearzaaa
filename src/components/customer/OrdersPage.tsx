import { useEffect, useState } from 'react';
import { supabase, Order } from '../../lib/supabase';
import { Package, Clock, Truck, CheckCircle, XCircle, MapPin, Trash2 } from 'lucide-react';

const STATUS: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: '#f59e0b', icon: Clock, label: 'Pending' },
  confirmed: { color: '#3b82f6', icon: CheckCircle, label: 'Confirmed' },
  shipped: { color: '#8b5cf6', icon: Truck, label: 'Shipped' },
  delivered: { color: '#22c55e', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: '#ef4444', icon: XCircle, label: 'Cancelled' },
};

export default function OrdersPage({ onHome }: { onHome: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneFilter, setPhoneFilter] = useState('');

  async function load() {
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(50);
    setOrders(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function cancelOrder(id: string) {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  const filtered = phoneFilter ? orders.filter(o => o.customer_phone.includes(phoneFilter)) : orders;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Track Orders</h1>

      <div className="mb-4">
        <input type="tel" placeholder="Filter by your phone number..." value={phoneFilter} onChange={e => setPhoneFilter(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">No orders found</p>
          <button onClick={onHome} className="mt-4 text-sm font-bold" style={{ color: '#ff3b30' }}>Start Shopping</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = STATUS[order.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={order.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Order #{order.order_number}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: cfg.color + '15', color: cfg.color }}>
                    <StatusIcon size={12} /> {cfg.label}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <img src={item.product_image || 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=100'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 line-clamp-1">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Qty {item.quantity}{item.selected_size ? ` • Size: ${item.selected_size}` : ''}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">Rs. {item.total_price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {(order.province || order.map_url) && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-500 flex items-start gap-1.5">
                    <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <span>{order.municipality ? `${order.municipality}-${order.ward_number}, ` : ''}{order.district}, {order.province}</span>
                      {order.map_url && <a href={order.map_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">View on Maps</a>}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="font-black" style={{ color: '#ff3b30' }}>Rs. {order.total.toLocaleString()}</p>
                  </div>
                  {order.status === 'pending' ? (
                    <button onClick={() => cancelOrder(order.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={12} /> Cancel Order
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Truck size={12} /> COD</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

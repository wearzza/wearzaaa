import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export default function CartDrawer({ open, onClose, onCheckout }: { open: boolean; onClose: () => void; onCheckout: () => void }) {
  const { items, removeFromCart, updateQty, totalPrice, totalItems } = useCart();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} style={{ color: '#ff3b30' }} />
            <h2 className="font-bold text-gray-800">My Cart ({totalItems})</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-1">Add some products to get started</p>
            </div>
          ) : items.map(item => (
            <div key={item.product.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <img
                src={item.product.image_urls[0] || 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=100'}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.product.sellers?.business_name}</p>
                <p className="text-sm font-bold mt-1" style={{ color: '#ff3b30' }}>Rs. {(item.product.real_price * item.quantity).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeFromCart(item.product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:border-red-400 transition-colors">
                    <Minus size={10} />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:border-red-400 transition-colors">
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-xl font-black" style={{ color: '#ff3b30' }}>Rs. {totalPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={() => { onClose(); onCheckout(); }}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ff3b30 0%, #e8251a 100%)' }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

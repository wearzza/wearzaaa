import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import HomePage from './HomePage';
import CategoryPage from './CategoryPage';
import ProductDetail from './ProductDetail';
import Checkout from './Checkout';
import OrdersPage from './OrdersPage';
import CartDrawer from './CartDrawer';
import { Product } from '../../lib/supabase';

interface Props {
  onSellerLogin: () => void;
  onAdminLogin: () => void;
}

type Page = 'home' | 'men' | 'women' | 'streetwear' | 'budget' | 'product' | 'checkout' | 'orders' | 'success';

export default function CustomerPanel({ onSellerLogin, onAdminLogin }: Props) {
  const [page, setPage] = useState<Page>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  function navigate(p: string) {
    setPage(p as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onCartOpen={() => setCartOpen(true)} onSearch={setSearchQuery} searchQuery={searchQuery} onPageChange={navigate} currentPage={page} />

      <main className="flex-1">
        {page === 'home' && <HomePage onProductClick={p => { setSelectedProduct(p); setPage('product'); window.scrollTo({ top: 0 }); }} onCategoryClick={navigate} searchQuery={searchQuery} />}

        {(page === 'men' || page === 'women' || page === 'streetwear' || page === 'budget') && (
          <CategoryPage category={page} searchQuery={searchQuery} onProductClick={p => { setSelectedProduct(p); setPage('product'); window.scrollTo({ top: 0 }); }} />
        )}

        {page === 'product' && selectedProduct && (
          <ProductDetail product={selectedProduct} onBack={() => navigate('home')} onCheckout={() => { setPage('checkout'); window.scrollTo({ top: 0 }); }} />
        )}

        {page === 'checkout' && <Checkout onBack={() => navigate('home')} onSuccess={num => { setOrderNumber(num); setPage('success'); window.scrollTo({ top: 0 }); }} />}

        {page === 'orders' && <OrdersPage onHome={() => navigate('home')} />}

        {page === 'success' && (
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: '#22c55e15' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Order Placed!</h1>
            <p className="text-gray-500 mb-1">Your order number:</p>
            <p className="text-lg font-bold mb-6" style={{ color: '#ff3b30' }}>{orderNumber}</p>
            <p className="text-sm text-gray-400 mb-8">Pay with Cash on Delivery when your order arrives.</p>
            <button onClick={() => navigate('orders')} className="px-6 py-3 rounded-xl font-bold text-sm text-white" style={{ background: '#ff3b30' }}>Track My Order</button>
          </div>
        )}
      </main>

      <Footer onSellerLogin={onSellerLogin} onAdminLogin={onAdminLogin} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setPage('checkout'); window.scrollTo({ top: 0 }); }} />
    </div>
  );
}

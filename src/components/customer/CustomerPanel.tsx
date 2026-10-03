import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import HomePage from './HomePage';
import CategoryPage from './CategoryPage';
import ProductDetail from './ProductDetail';
import Checkout from './Checkout';
import OrdersPage from './OrdersPage';
import CartDrawer from './CartDrawer';
import ShopPage from './ShopPage';
import { Product, Seller } from '../../lib/supabase';

interface Props {
  onSellerLogin: () => void;
  onAdminLogin: () => void;
  initialShop?: string;
}

const FIXED = ['home', 'product', 'checkout', 'orders', 'success', 'shop'];

export default function CustomerPanel({ onSellerLogin, onAdminLogin, initialShop }: Props) {
  const [page, setPage] = useState<string>(initialShop ? 'shop' : 'home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<{ handle?: string; seller?: Seller | null }>({ handle: initialShop });
  const [cartOpen, setCartOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  function navigate(p: string) {
    setPage(p);
    if (p !== 'shop' && window.location.pathname.startsWith('/s/')) window.history.replaceState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const openProduct = (p: Product) => { setSelectedProduct(p); setSearchQuery(''); navigate('product'); };
  const openShop = (s: Seller) => { setShop({ seller: s }); navigate('shop'); };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <Navbar onCartOpen={() => setCartOpen(true)} onSearch={setSearchQuery} searchQuery={searchQuery} onPageChange={navigate} currentPage={page} onProductClick={openProduct} onShopClick={openShop} />

      <main className="flex-1">
        {page === 'home' && <HomePage onProductClick={openProduct} onCategoryClick={navigate} searchQuery={searchQuery} onShopClick={openShop} />}

        {!FIXED.includes(page) && <CategoryPage category={page} searchQuery={searchQuery} onProductClick={openProduct} />}

        {page === 'shop' && <ShopPage handle={shop.handle} seller={shop.seller} onBack={() => navigate('home')} onProductClick={openProduct} />}

        {page === 'product' && selectedProduct && (
          <ProductDetail product={selectedProduct} onBack={() => navigate('home')} onCheckout={() => navigate('checkout')} onShopClick={openShop} />
        )}

        {page === 'checkout' && <Checkout onBack={() => navigate('home')} onSuccess={num => { setOrderNumber(num); navigate('success'); }} />}

        {page === 'orders' && <OrdersPage onHome={() => navigate('home')} />}

        {page === 'success' && (
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-chart-green/10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--chart-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">Order Placed!</h1>
            <p className="text-muted-foreground mb-1">Your order number:</p>
            <p className="text-lg font-bold mb-6 text-primary">{orderNumber}</p>
            <p className="text-sm text-muted-foreground mb-8">Pay with Cash on Delivery when your order arrives.</p>
            <button onClick={() => navigate('orders')} className="px-6 py-3 rounded-full font-bold text-sm bg-primary text-primary-foreground">Track My Order</button>
          </div>
        )}
      </main>

      <Footer onSellerLogin={onSellerLogin} onAdminLogin={onAdminLogin} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => navigate('checkout')} />
    </div>
  );
}

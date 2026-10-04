import { useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import { SellerProvider, useSeller } from './contexts/SellerContext';
import SplashScreen from './components/SplashScreen';
import CustomerPanel from './components/customer/CustomerPanel';
import SellerAuth from './components/seller/SellerAuth';
import SellerDashboard from './components/seller/SellerDashboard';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';

type View = 'splash' | 'customer' | 'seller-auth' | 'seller-dashboard' | 'admin-login' | 'admin-panel';

function readShopHandle() {
  const m = window.location.pathname.match(/^\/s\/([^/?#]+)/);
  if (m) return decodeURIComponent(m[1]);
  return new URLSearchParams(window.location.search).get('shop') || undefined;
}

function AppInner() {
  const [initialShop] = useState(readShopHandle);
  const [view, setView] = useState<View>(initialShop ? 'customer' : 'splash');
  const { seller } = useSeller();

  return (
    <>
      {view === 'splash' && <SplashScreen onComplete={() => setView('customer')} />}

      {view === 'customer' && (
        <CustomerPanel
          initialShop={initialShop}
          onSellerLogin={() => setView(seller ? 'seller-dashboard' : 'seller-auth')}
          onAdminLogin={() => setView('admin-login')}
        />
      )}

      {view === 'seller-auth' && (
        <SellerAuth onBack={() => setView('customer')} onSuccess={() => setView('seller-dashboard')} />
      )}

      {view === 'seller-dashboard' && seller && <SellerDashboard />}
      {view === 'seller-dashboard' && !seller && <SellerAuth onBack={() => setView('customer')} onSuccess={() => setView('seller-dashboard')} />}

      {view === 'admin-login' && <AdminLogin onLogin={() => setView('admin-panel')} onBack={() => setView('customer')} />}
      {view === 'admin-panel' && <AdminPanel onLogout={() => setView('customer')} />}
    </>
  );
}

export default function App() {
  return (
    <SellerProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </SellerProvider>
  );
}

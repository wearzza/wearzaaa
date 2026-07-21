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

function AppInner() {
  const [view, setView] = useState<View>('splash');
  const { seller } = useSeller();

  return (
    <>
      {view === 'splash' && <SplashScreen onComplete={() => setView('customer')} />}

      {view === 'customer' && (
        <CustomerPanel
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

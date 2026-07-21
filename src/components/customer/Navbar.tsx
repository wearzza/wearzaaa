import { ShoppingCart, Search, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';

interface Props {
  onCartOpen: () => void;
  onSearch: (q: string) => void;
  searchQuery: string;
  onPageChange: (p: string) => void;
  currentPage: string;
}

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'kids', label: 'Kids' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'old_money', label: 'Old Money' },
  { id: 'budget', label: 'Budget Deals' },
];

export default function Navbar({ onCartOpen, onSearch, searchQuery, onPageChange, currentPage }: Props) {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100" style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-3">
          <button onClick={() => onPageChange('home')} className="flex-shrink-0">
            <img src="/assets/images/f5843efc-6c3d-47ff-b16f-26605943a43c.png" alt="Wearza" className="h-8 object-contain" />
          </button>

          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search fashion, brands, styles..."
                value={searchQuery}
                onChange={e => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-gray-50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setSearchOpen(s => !s)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <Search size={18} className="text-gray-600" />
            </button>
            <button onClick={() => onPageChange('orders')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              <User size={16} /><span>Orders</span>
            </button>
            <button onClick={onCartOpen} className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors">
              <ShoppingCart size={18} className="text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
            <button onClick={() => setMobileOpen(m => !m)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => onSearch(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
              />
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center gap-1 pb-2">
          {NAV.map(l => (
            <button
              key={l.id}
              onClick={() => onPageChange(l.id)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                color: currentPage === l.id ? '#ff3b30' : '#4b5563',
                background: currentPage === l.id ? '#fff1f0' : 'transparent',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {NAV.map(l => (
            <button
              key={l.id}
              onClick={() => { onPageChange(l.id); setMobileOpen(false); }}
              className="text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ color: currentPage === l.id ? '#ff3b30' : '#374151' }}
            >
              {l.label}
            </button>
          ))}
          <button onClick={() => { onPageChange('orders'); setMobileOpen(false); }} className="text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <User size={16} /> My Orders
          </button>
        </div>
      )}
    </nav>
  );
}

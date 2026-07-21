import { Store, Shield, Instagram, Facebook, ArrowRight } from 'lucide-react';

interface Props {
  onSellerLogin: () => void;
  onAdminLogin: () => void;
}

export default function Footer({ onSellerLogin, onAdminLogin }: Props) {
  return (
    <footer className="bg-white border-t border-gray-100 mt-12" style={{ boxShadow: '0 -2px 20px rgba(0,0,0,0.04)' }}>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src="/assets/images/f5843efc-6c3d-47ff-b16f-26605943a43c.png" alt="Wearza" className="h-8 object-contain" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-sm">
              Wearza is Nepal's verified fashion marketplace. Shop from trusted sellers with Cash on Delivery.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><Instagram size={16} className="text-gray-600" /></a>
              <a href="#" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><Facebook size={16} className="text-gray-600" /></a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-sm">For Sellers</h3>
            <button onClick={onSellerLogin} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500 transition-colors mb-2">
              <Store size={14} /> Seller Signup / Login <ArrowRight size={12} />
            </button>
            <p className="text-xs text-gray-400">Join Wearza as a verified seller</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Admin</h3>
            <button onClick={onAdminLogin} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              <Shield size={12} /> Admin Login
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">© 2026 Wearza. All rights reserved.</p>
          <p className="text-xs text-gray-400">Verified Fashion Stores in Nepal</p>
        </div>
      </div>
    </footer>
  );
}

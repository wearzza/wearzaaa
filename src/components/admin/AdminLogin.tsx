import { useState } from 'react';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../../lib/auth';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminLogin({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) onLogin();
    else setError('Invalid admin credentials');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 hover:text-gray-800 transition-colors"><ArrowLeft size={16} /> Back to Wearza</button>
        <div className="bg-white rounded-3xl p-8" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #1a2340, #2a3360)' }}><Shield size={28} className="text-white" /></div>
            <h1 className="text-2xl font-black text-gray-900">Admin Login</h1>
            <p className="text-sm text-gray-400 mt-1">Restricted access</p>
          </div>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={handleLogin} className="w-full py-3.5 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #1a2340, #2a3360)' }}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

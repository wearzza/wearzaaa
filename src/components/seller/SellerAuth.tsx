import { useState } from 'react';
import { supabase, Seller } from '../../lib/supabase';
import { hashPassword, verifyPassword } from '../../lib/auth';
import { useSeller } from '../../contexts/SellerContext';
import { PROVINCES, getDistricts, getMunicipalities } from '../../lib/nepalLocations';
import { Store, ArrowLeft, Check, Camera, Upload, Shield, FileText, MapPin, Navigation, CreditCard } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const BUSINESS_TERMS = [
  'All products must be genuine',
  'Seller handles delivery themselves',
  'Cash on Delivery (COD) is mandatory',
  'Seller is responsible for product quality',
  'Seller must pay platform commission (25%) after order completion',
  'Payment must be sent to eSewa number: 9807470285',
];

const LEGAL_TERMS = [
  'All submitted documents are real and authentic',
  'Identity verification information is accurate',
  'Fake or misleading information leads to permanent ban',
  'Admin has full rights to approve or reject account',
  'Seller must deliver within committed time',
  'Fake or misleading products will lead to ban',
];

export default function SellerAuth({ onBack, onSuccess }: Props) {
  const { setSeller } = useSeller();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', business_name: '', instagram: '', tiktok: '',
    shop_description: '', password: '', shop_logo_url: '',
    province: '', district: '', municipality: '', ward_number: '', map_url: '',
    face_image_url: '', citizenship_front_url: '', citizenship_back_url: '',
    shop_registration_url: '', pan_vat_url: '', business_license_url: '',
    terms_business_agreed: false, terms_legal_agreed: false,
    cameraActive: false, faceCaptured: false,
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    const { data } = await supabase.from('sellers').select('*').eq('email', loginForm.email).maybeSingle();
    if (!data) { setError('No account found with this email'); setLoading(false); return; }
    if (!verifyPassword(loginForm.password, data.password_hash)) { setError('Incorrect password'); setLoading(false); return; }
    if (data.status === 'banned') { setError('Your account has been banned. Contact admin.'); setLoading(false); return; }
    if (data.status === 'rejected') { setError('Your seller application was rejected.'); setLoading(false); return; }
    setSeller(data as Seller);
    setLoading(false);
    onSuccess();
  }

  async function handleSignup() {
    setError('');
    setLoading(true);
    if (!form.terms_business_agreed || !form.terms_legal_agreed) { setError('You must agree to both agreements'); setLoading(false); return; }
    if (!form.face_image_url) { setError('Face verification is required'); setLoading(false); return; }
    if (!form.citizenship_front_url || !form.citizenship_back_url) { setError('Citizenship images are required'); setLoading(false); return; }
    if (!form.shop_registration_url || !form.pan_vat_url) { setError('Shop Registration and PAN/VAT certificates are required'); setLoading(false); return; }

    const { data: existing } = await supabase.from('sellers').select('id').eq('email', form.email).maybeSingle();
    if (existing) { setError('An account with this email already exists'); setLoading(false); return; }

    const locationStr = `${form.municipality || form.district}, Ward ${form.ward_number}, ${form.district}, ${form.province}`;
    const { data, error: ie } = await supabase.from('sellers').insert({
      full_name: form.full_name, phone: form.phone, email: form.email, business_name: form.business_name,
      instagram: form.instagram || null, tiktok: form.tiktok || null, shop_logo_url: form.shop_logo_url || null,
      shop_description: form.shop_description || null, shop_location: locationStr,
      province: form.province, district: form.district, municipality: form.municipality,
      ward_number: form.ward_number ? +form.ward_number : null, map_url: form.map_url || null,
      password_hash: hashPassword(form.password), status: 'pending', face_image_url: form.face_image_url,
      shop_registration_url: form.shop_registration_url, pan_vat_url: form.pan_vat_url,
      business_license_url: form.business_license_url || null,
      citizenship_front_url: form.citizenship_front_url, citizenship_back_url: form.citizenship_back_url,
      terms_agreed: true, terms_business_agreed: form.terms_business_agreed, terms_legal_agreed: form.terms_legal_agreed,
      commission_rate: 25,
    }).select().single();

    if (ie || !data) { setError('Failed to create account. Please try again.'); setLoading(false); return; }
    setSeller(data as Seller);
    setLoading(false);
    onSuccess();
  }

  async function startCamera() {
    setForm({ ...form, cameraActive: true });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('face-cam') as HTMLVideoElement;
      if (video) { video.srcObject = stream; video.play(); }
    } catch {
      setError('Camera access denied. Please allow camera permission.');
      setForm({ ...form, cameraActive: false });
    }
  }

  function captureFace() {
    const video = document.getElementById('face-cam') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setForm({ ...form, face_image_url: canvas.toDataURL('image/jpeg', 0.7), faceCaptured: true, cameraActive: false });
    (video.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
  }

  function handleUpload(field: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, [field]: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function captureLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setForm(prev => ({ ...prev, map_url: url }));
      },
      () => setError('Could not get location. Please allow location access.'),
    );
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 hover:text-gray-800 transition-colors"><ArrowLeft size={16} /> Back to Wearza</button>
          <div className="bg-white rounded-3xl p-8" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}><Store size={28} className="text-white" /></div>
              <h1 className="text-2xl font-black text-gray-900">Seller Login</h1>
              <p className="text-sm text-gray-400 mt-1">Access your seller dashboard</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
                <input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
                <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button onClick={handleLogin} disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>{loading ? 'Logging in...' : 'Login'}</button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">Don't have an account? <button onClick={() => { setMode('signup'); setStep(1); setError(''); }} className="font-bold" style={{ color: '#ff3b30' }}>Sign up</button></p>
          </div>
        </div>
      </div>
    );
  }

  const districts = getDistricts(form.province);
  const municipalities = getMunicipalities(form.province, form.district);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 hover:text-gray-800 transition-colors"><ArrowLeft size={16} /> Back to Wearza</button>
        <div className="bg-white rounded-3xl p-6 sm:p-8" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}><Store size={24} className="text-white" /></div>
            <h1 className="text-2xl font-black text-gray-900">Become a Seller</h1>
            <p className="text-sm text-gray-400 mt-1">Step {step} of 4</p>
          </div>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map(s => <div key={s} className="flex-1 h-1.5 rounded-full transition-colors" style={{ background: s <= step ? '#ff3b30' : '#e5e7eb' }} />)}
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>}

          {/* STEP 1: Business Info + Location */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800">Business Information</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Business Name *</label><input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Instagram (optional)</label><input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@username" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">TikTok (optional)</label><input value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} placeholder="@username" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Shop Description</label><textarea value={form.shop_description} onChange={e => setForm({ ...form, shop_description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 resize-none" /></div>

              {/* Structured Location */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3"><MapPin size={18} style={{ color: '#3b82f6' }} /><h3 className="font-bold text-gray-800 text-sm">Shop Location</h3></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Province *</label>
                    <select value={form.province} onChange={e => setForm({ ...form, province: e.target.value, district: '', municipality: '' })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white">
                      <option value="">Select Province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">District *</label>
                    <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value, municipality: '' })} disabled={!form.province} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white disabled:bg-gray-100">
                      <option value="">Select District</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Municipality *</label>
                    <select value={form.municipality} onChange={e => setForm({ ...form, municipality: e.target.value })} disabled={!form.district} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white disabled:bg-gray-100">
                      <option value="">Select Municipality</option>
                      {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Ward Number *</label>
                    <input type="number" value={form.ward_number} onChange={e => setForm({ ...form, ward_number: e.target.value })} min="1" placeholder="e.g. 5" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Google Maps Location</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.map_url} onChange={e => setForm({ ...form, map_url: e.target.value })} placeholder="Google Maps URL (auto or paste)" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
                    <button onClick={captureLocation} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap" style={{ background: '#3b82f6' }}><Navigation size={14} /> Capture</button>
                  </div>
                  {form.map_url && <a href={form.map_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 mt-1 inline-block hover:underline">View on Maps</a>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Shop Logo</label>
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors">
                  <Upload size={16} className="text-gray-400" /><span className="text-sm text-gray-500">{form.shop_logo_url ? 'Logo selected' : 'Upload shop logo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload('shop_logo_url', e)} />
                </label>
                {form.shop_logo_url && <img src={form.shop_logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover mt-2" />}
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Password *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" /></div>
              <button onClick={() => {
                if (!form.full_name || !form.phone || !form.email || !form.business_name || !form.password) { setError('Please fill all required fields'); return; }
                if (!form.province || !form.district || !form.municipality || !form.ward_number) { setError('Please complete all location fields'); return; }
                setError(''); setStep(2);
              }} className="w-full py-3.5 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>Continue</button>
            </div>
          )}

          {/* STEP 2: Owner Verification (Face + Citizenship) */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Camera size={18} /> Owner Verification</h2>
              <p className="text-sm text-gray-500">We need to verify your identity with live face capture and citizenship documents.</p>

              {/* Face Verification */}
              <div className="p-4 bg-gray-50 rounded-2xl">
                <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><Camera size={16} /> Live Face Verification *</h3>
                {!form.cameraActive && !form.faceCaptured && (
                  <button onClick={startCamera} className="w-full py-8 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-2 hover:border-red-400 transition-colors bg-white">
                    <Camera size={32} className="text-gray-300" /><span className="text-sm font-medium text-gray-500">Start Camera</span>
                  </button>
                )}
                {form.cameraActive && (
                  <div className="relative rounded-2xl overflow-hidden bg-black" style={{ paddingBottom: '75%' }}>
                    <video id="face-cam" className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-40 h-48 border-2 border-white/70 rounded-3xl" /></div>
                    <button onClick={captureFace} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white font-bold text-sm">Capture</button>
                  </div>
                )}
                {form.faceCaptured && (
                  <div className="flex flex-col items-center gap-2">
                    <img src={form.face_image_url} alt="face" className="w-32 h-40 object-cover rounded-2xl" />
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#22c55e' }}><Check size={16} /> Face verified!</div>
                    <button onClick={() => setForm({ ...form, faceCaptured: false, face_image_url: '' })} className="text-xs text-gray-500 underline">Retake</button>
                  </div>
                )}
              </div>

              {/* Citizenship Verification */}
              <div className="p-4 bg-gray-50 rounded-2xl">
                <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><CreditCard size={16} /> Citizenship Verification *</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Citizenship Front *</label>
                    {form.citizenship_front_url ? (
                      <div className="relative">
                        <img src={form.citizenship_front_url} alt="citizenship front" className="w-full h-28 rounded-xl object-cover" />
                        <button onClick={() => setForm({ ...form, citizenship_front_url: '' })} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-1 px-3 py-6 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors bg-white h-28 justify-center">
                        <Upload size={20} className="text-gray-300" /><span className="text-xs text-gray-500">Upload Front</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload('citizenship_front_url', e)} />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Citizenship Back *</label>
                    {form.citizenship_back_url ? (
                      <div className="relative">
                        <img src={form.citizenship_back_url} alt="citizenship back" className="w-full h-28 rounded-xl object-cover" />
                        <button onClick={() => setForm({ ...form, citizenship_back_url: '' })} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-1 px-3 py-6 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors bg-white h-28 justify-center">
                        <Upload size={20} className="text-gray-300" /><span className="text-xs text-gray-500">Upload Back</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload('citizenship_back_url', e)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-600">Back</button>
                <button onClick={() => {
                  if (!form.face_image_url) { setError('Please capture your face'); return; }
                  if (!form.citizenship_front_url || !form.citizenship_back_url) { setError('Please upload both sides of citizenship'); return; }
                  setError(''); setStep(3);
                }} className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>Continue</button>
              </div>
            </div>
          )}

          {/* STEP 3: Legal Documents */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><FileText size={18} /> Legal Documents</h2>
              <p className="text-sm text-gray-500">Upload your business registration documents for verification.</p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Shop Registration Certificate *</label>
                  {form.shop_registration_url ? (
                    <div className="relative">
                      <img src={form.shop_registration_url} alt="shop registration" className="w-full h-32 rounded-xl object-cover" />
                      <button onClick={() => setForm({ ...form, shop_registration_url: '' })} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">×</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 px-4 py-8 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors bg-white">
                      <Upload size={28} className="text-gray-300" /><span className="text-sm text-gray-500">Upload Shop Registration Certificate</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload('shop_registration_url', e)} />
                    </label>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">PAN or VAT Certificate *</label>
                  {form.pan_vat_url ? (
                    <div className="relative">
                      <img src={form.pan_vat_url} alt="pan vat" className="w-full h-32 rounded-xl object-cover" />
                      <button onClick={() => setForm({ ...form, pan_vat_url: '' })} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">×</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 px-4 py-8 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors bg-white">
                      <Upload size={28} className="text-gray-300" /><span className="text-sm text-gray-500">Upload PAN or VAT Certificate</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload('pan_vat_url', e)} />
                    </label>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Business License (optional)</label>
                  {form.business_license_url ? (
                    <div className="relative">
                      <img src={form.business_license_url} alt="business license" className="w-full h-32 rounded-xl object-cover" />
                      <button onClick={() => setForm({ ...form, business_license_url: '' })} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">×</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 px-4 py-8 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-red-400 transition-colors bg-white">
                      <Upload size={28} className="text-gray-300" /><span className="text-sm text-gray-500">Upload Business License (if available)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload('business_license_url', e)} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-600">Back</button>
                <button onClick={() => {
                  if (!form.shop_registration_url) { setError('Shop Registration Certificate is required'); return; }
                  if (!form.pan_vat_url) { setError('PAN or VAT Certificate is required'); return; }
                  setError(''); setStep(4);
                }} className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>Continue</button>
              </div>
            </div>
          )}

          {/* STEP 4: Terms & Conditions (2 checkboxes) */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Shield size={18} /> Seller Agreement</h2>

              {/* Business Agreement */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><Store size={14} /> Business Agreement</h3>
                <div className="space-y-1.5 mb-3">
                  {BUSINESS_TERMS.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold" style={{ color: '#ff3b30' }}>{i + 1}</span></span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                  <input type="checkbox" checked={form.terms_business_agreed} onChange={e => setForm({ ...form, terms_business_agreed: e.target.checked })} className="mt-0.5 w-4 h-4 accent-red-500" />
                  <span className="text-xs text-gray-700">I agree to the Business Agreement terms above.</span>
                </label>
              </div>

              {/* Legal & Identity Agreement */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><Shield size={14} /> Legal & Identity Agreement</h3>
                <div className="space-y-1.5 mb-3">
                  {LEGAL_TERMS.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold" style={{ color: '#ff3b30' }}>{i + 1}</span></span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                  <input type="checkbox" checked={form.terms_legal_agreed} onChange={e => setForm({ ...form, terms_legal_agreed: e.target.checked })} className="mt-0.5 w-4 h-4 accent-red-500" />
                  <span className="text-xs text-gray-700">I agree to the Legal & Identity Agreement terms above.</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-600">Back</button>
                <button onClick={handleSignup} disabled={loading} className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ff3b30, #e8251a)' }}>{loading ? 'Creating...' : 'Submit Application'}</button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <button onClick={() => { setMode('login'); setError(''); }} className="font-bold" style={{ color: '#ff3b30' }}>Login</button></p>
        </div>
      </div>
    </div>
  );
}

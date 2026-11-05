import { supabase } from './supabase';

export interface CommissionPayment { id: string; seller_id: string; amount: number; screenshot_url: string; reference?: string | null; note?: string | null; status: 'pending' | 'approved' | 'rejected'; admin_note?: string | null; reviewed_at?: string | null; created_at: string }
export const QR_KEY = 'commission_qr';

export async function loadQr() {
  const { data } = await supabase.from('app_settings').select('value').eq('key', QR_KEY).maybeSingle();
  return (data?.value as string) || '';
}
export async function saveQr(value: string) {
  return supabase.from('app_settings').upsert({ key: QR_KEY, value, updated_at: new Date().toISOString() });
}
export function readImage(file: File, maxBytes = 3_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    if (file.size > maxBytes) return reject(new Error('Image is too large (max 3 MB).'));
    const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error('Could not read image.')); r.readAsDataURL(file);
  });
}

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'banned';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type ProductCategory = 'men' | 'women' | 'streetwear' | 'budget' | 'kids' | 'old_money';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  button_text: string;
  button_link: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  business_name: string;
  instagram?: string;
  tiktok?: string;
  shop_logo_url?: string;
  shop_description?: string;
  shop_location: string;
  province?: string;
  district?: string;
  municipality?: string;
  ward_number?: number;
  map_url?: string;
  shop_registration_url?: string;
  pan_vat_url?: string;
  business_license_url?: string;
  citizenship_front_url?: string;
  citizenship_back_url?: string;
  password_hash: string;
  status: SellerStatus;
  face_image_url?: string;
  document_url?: string;
  terms_agreed: boolean;
  terms_business_agreed: boolean;
  terms_legal_agreed: boolean;
  commission_rate: number;
  shop_banner_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  categories?: ProductCategory[];
  real_price: number;
  cut_price?: number;
  image_urls: string[];
  video_url?: string;
  video_data?: string;
  stock: number;
  is_active: boolean;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  sellers?: Seller;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_location: string;
  province?: string;
  district?: string;
  municipality?: string;
  ward_number?: number;
  map_url?: string;
  seller_id: string;
  promo_code?: string;
  promo_discount: number;
  subtotal: number;
  total: number;
  payment_method: string;
  status: OrderStatus;
  notes?: string;
  commission_paid: boolean;
  created_at: string;
  updated_at: string;
  sellers?: Seller;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  selected_size?: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  seller_id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  seller_id?: string;
  is_active: boolean;
  usage_count: number;
  max_usage?: number;
  expires_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  seller_id?: string;
  is_read: boolean;
  created_at: string;
}

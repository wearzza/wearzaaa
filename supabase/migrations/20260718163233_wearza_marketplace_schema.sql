/*
# Wearza Marketplace - Full Schema

1. Tables
  - sellers: Shop accounts with face/doc verification, status workflow
  - products: Items listed by sellers (category, pricing, images)
  - orders: Customer purchase orders (COD only)
  - order_items: Line items per order
  - reviews: Star ratings + comments per product
  - promo_codes: Discount codes created by sellers
  - notifications: Admin-to-seller messaging

2. Security
  - RLS enabled on all tables
  - anon + authenticated access (no customer login required)
  - Sellers identified by session stored in localStorage (app-level)

3. Notes
  - Admin is hardcoded (no DB row needed)
  - Seller status: pending | approved | rejected | banned
  - Order status: pending | confirmed | shipped | delivered | cancelled
  - 25% commission paid via eSewa 9807470285 after delivery
*/

-- SELLERS
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  business_name text NOT NULL,
  instagram text,
  tiktok text,
  shop_logo_url text,
  shop_description text,
  shop_location text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','banned')),
  face_image_url text,
  document_url text,
  terms_agreed boolean NOT NULL DEFAULT false,
  commission_rate numeric NOT NULL DEFAULT 25,
  shop_banner_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sellers_select" ON sellers;
CREATE POLICY "sellers_select" ON sellers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sellers_insert" ON sellers;
CREATE POLICY "sellers_insert" ON sellers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "sellers_update" ON sellers;
CREATE POLICY "sellers_update" ON sellers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "sellers_delete" ON sellers;
CREATE POLICY "sellers_delete" ON sellers FOR DELETE TO anon, authenticated USING (true);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('men','women','streetwear','budget')),
  real_price numeric NOT NULL,
  cut_price numeric,
  image_urls text[] NOT NULL DEFAULT '{}',
  video_url text,
  stock integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  avg_rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete" ON products FOR DELETE TO anon, authenticated USING (true);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT 'WZ-' || upper(substring(gen_random_uuid()::text,1,8)),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_location text NOT NULL,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  promo_code text,
  promo_discount numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL,
  total numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cod',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  notes text,
  commission_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "orders_delete" ON orders;
CREATE POLICY "orders_delete" ON orders FOR DELETE TO anon, authenticated USING (true);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  product_image text,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "order_items_update" ON order_items;
CREATE POLICY "order_items_update" ON order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "order_items_delete" ON order_items;
CREATE POLICY "order_items_delete" ON order_items FOR DELETE TO anon, authenticated USING (true);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "reviews_update" ON reviews;
CREATE POLICY "reviews_update" ON reviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "reviews_delete" ON reviews;
CREATE POLICY "reviews_delete" ON reviews FOR DELETE TO anon, authenticated USING (true);

-- PROMO CODES
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  max_usage integer,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promos_select" ON promo_codes;
CREATE POLICY "promos_select" ON promo_codes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "promos_insert" ON promo_codes;
CREATE POLICY "promos_insert" ON promo_codes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "promos_update" ON promo_codes;
CREATE POLICY "promos_update" ON promo_codes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "promos_delete" ON promo_codes;
CREATE POLICY "promos_delete" ON promo_codes FOR DELETE TO anon, authenticated USING (true);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifs_select" ON notifications;
CREATE POLICY "notifs_select" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "notifs_insert" ON notifications;
CREATE POLICY "notifs_insert" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "notifs_update" ON notifications;
CREATE POLICY "notifs_update" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "notifs_delete" ON notifications;
CREATE POLICY "notifs_delete" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_notifs_seller ON notifications(seller_id);

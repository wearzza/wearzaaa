/*
# Wearza: OTP System, Dynamic Banners, New Categories

## 1. OTP System (WhatsApp-based)
- New table `otp_codes`: stores generated OTPs with phone number, code, expiry, and verification status.
- OTPs expire after 5 minutes. Each OTP can only be verified once.
- Used by the `whatsapp-otp` edge function to generate, send, and verify codes.

## 2. Dynamic Banners (Admin-controlled)
- New table `banners`: admin-managed homepage banners with title, subtitle, button text/link, image, and display order.
- Only one banner is "active" at a time (the one with is_active=true and lowest sort_order).
- Customer homepage reads the active banner dynamically.

## 3. New Product Categories
- Products table category constraint updated to include 'kids' and 'old_money'.
- 'kids' = Kids fashion, 'old_money' = premium/classic style section.

## Security
- RLS enabled on all new tables with anon+authenticated CRUD (no-auth app pattern).
- OTP table is writable by anon (needed for edge function + frontend verification flow).
*/

-- ===== OTP CODES TABLE =====
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "otp_select" ON otp_codes;
CREATE POLICY "otp_select" ON otp_codes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "otp_insert" ON otp_codes;
CREATE POLICY "otp_insert" ON otp_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "otp_update" ON otp_codes;
CREATE POLICY "otp_update" ON otp_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "otp_delete" ON otp_codes;
CREATE POLICY "otp_delete" ON otp_codes FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- ===== BANNERS TABLE =====
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  button_text text DEFAULT 'Shop Now',
  button_link text DEFAULT 'women',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_select" ON banners;
CREATE POLICY "banners_select" ON banners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "banners_insert" ON banners;
CREATE POLICY "banners_insert" ON banners FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "banners_update" ON banners;
CREATE POLICY "banners_update" ON banners FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "banners_delete" ON banners;
CREATE POLICY "banners_delete" ON banners FOR DELETE
  TO anon, authenticated USING (true);

-- ===== UPDATE PRODUCT CATEGORY CONSTRAINT =====
-- Drop old constraint and add new one with kids + old_money
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('men','women','streetwear','budget','kids','old_money'));

-- ===== SEED DEFAULT BANNER =====
INSERT INTO banners (title, subtitle, button_text, button_link, is_active, sort_order)
SELECT 'Fashion that fits your style', 'Shop from verified fashion stores across Nepal. COD available.', 'Shop Now', 'women', true, 0
WHERE NOT EXISTS (SELECT 1 FROM banners LIMIT 1);

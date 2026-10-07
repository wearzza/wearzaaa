CREATE TABLE public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL, phone text NOT NULL, email text UNIQUE NOT NULL, business_name text NOT NULL,
  instagram text, tiktok text, shop_logo_url text, shop_description text, shop_location text NOT NULL DEFAULT '',
  province text, district text, municipality text, ward_number integer, map_url text,
  shop_registration_url text, pan_vat_url text, business_license_url text, citizenship_front_url text, citizenship_back_url text,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','banned')),
  face_image_url text, document_url text,
  terms_agreed boolean NOT NULL DEFAULT false, terms_business_agreed boolean NOT NULL DEFAULT false, terms_legal_agreed boolean NOT NULL DEFAULT false,
  commission_rate numeric NOT NULL DEFAULT 25, shop_banner_url text, shop_slug text UNIQUE,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name text NOT NULL, description text, category text NOT NULL DEFAULT 'men', categories text[] DEFAULT '{}',
  real_price numeric NOT NULL, cut_price numeric, image_urls text[] NOT NULL DEFAULT '{}',
  video_url text, video_data text, stock integer NOT NULL DEFAULT 1, is_active boolean NOT NULL DEFAULT true,
  avg_rating numeric NOT NULL DEFAULT 0, review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT 'WZ-' || upper(substring(gen_random_uuid()::text,1,8)),
  customer_name text NOT NULL, customer_phone text NOT NULL, customer_address text NOT NULL, customer_location text NOT NULL,
  province text, district text, municipality text, ward_number integer, map_url text,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  promo_code text, promo_discount numeric NOT NULL DEFAULT 0, subtotal numeric NOT NULL, total numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cod',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  notes text, commission_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL, product_image text, selected_size text,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1, unit_price numeric NOT NULL, total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL, rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5), comment text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, discount_percent numeric NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true, usage_count integer NOT NULL DEFAULT 0, max_usage integer, expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, message text NOT NULL,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false, created_at timestamptz DEFAULT now()
);
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, subtitle text, button_text text DEFAULT 'Shop Now', button_link text DEFAULT 'women', image_url text,
  is_active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, label text NOT NULL, icon text, color text,
  is_active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  created_by_seller uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL, code text NOT NULL, expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false, attempts integer NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sellers','products','orders','order_items','reviews','promo_codes','notifications','banners','categories','otp_codes'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t || '_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO anon, authenticated USING (true)', t || '_delete', t);
  END LOOP;
END $$;

CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_orders_seller ON public.orders(seller_id);
CREATE INDEX idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_notifs_seller ON public.notifications(seller_id);

CREATE OR REPLACE FUNCTION public.wearza_make_slug(_name text, _id uuid)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  base := trim(both '-' from regexp_replace(lower(coalesce(_name, 'shop')), '[^a-z0-9]+', '', 'g'));
  IF base = '' THEN base := 'shop'; END IF;
  base := left(base, 24);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.sellers WHERE shop_slug = candidate AND id <> _id) LOOP
    n := n + 1; candidate := base || n;
  END LOOP;
  RETURN candidate;
END $$;
CREATE OR REPLACE FUNCTION public.wearza_set_slug() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.shop_slug IS NULL OR NEW.shop_slug = '' THEN
    NEW.shop_slug := public.wearza_make_slug(NEW.business_name, NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wearza_set_slug BEFORE INSERT OR UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.wearza_set_slug();
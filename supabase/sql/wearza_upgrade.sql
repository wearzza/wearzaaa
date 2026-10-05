-- Wearza one-time setup: run once in your database SQL editor.
-- Your database currently blocks ALL changes from the website (ban/reject, banners, products, categories).
-- This restores the website's ability to save changes, adds short shop links, and lets sellers add categories.

-- 1) Allow the website to save changes on every store table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sellers','products','orders','order_items','reviews','promo_codes','notifications','banners','categories'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t || '_select', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t || '_insert', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t || '_update', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO anon, authenticated USING (true)', t || '_delete', t);
    END IF;
  END LOOP;
END $$;

-- 2) Short shop links
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS shop_slug text;
CREATE OR REPLACE FUNCTION public.wearza_make_slug(_name text, _id uuid)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  base := trim(both '-' from regexp_replace(lower(coalesce(_name, 'shop')), '[^a-z0-9]+', '-', 'g'));
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
DROP TRIGGER IF EXISTS wearza_set_slug ON public.sellers;
CREATE TRIGGER wearza_set_slug BEFORE INSERT OR UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.wearza_set_slug();
UPDATE public.sellers SET shop_slug = public.wearza_make_slug(business_name, id) WHERE shop_slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sellers_shop_slug_key ON public.sellers (shop_slug);

-- 3) Sellers can add their own categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_by_seller uuid REFERENCES public.sellers(id) ON DELETE SET NULL;

-- 4) Let products use any category
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

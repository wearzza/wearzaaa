-- Wearza upgrade: run once in your database SQL editor.
-- 1) Allow seller status changes (ban / reject / approve)
DROP POLICY IF EXISTS "sellers_update" ON public.sellers;
CREATE POLICY "sellers_update" ON public.sellers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.sellers TO anon, authenticated;

-- 2) Short shop links
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS shop_slug text;
CREATE OR REPLACE FUNCTION public.wearza_make_slug(_name text, _id uuid)
RETURNS text LANGUAGE plpgsql AS $$
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
CREATE OR REPLACE FUNCTION public.wearza_set_slug() RETURNS trigger LANGUAGE plpgsql AS $$
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

-- 3) Categories managed by admin, sellers can add their own
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_by_seller uuid REFERENCES public.sellers(id) ON DELETE SET NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update" ON public.categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_delete" ON public.categories FOR DELETE TO anon, authenticated USING (true);

-- 4) Let products use any category
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

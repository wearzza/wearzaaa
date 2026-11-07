ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'clothing';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_system text NOT NULL DEFAULT 'letter';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS measurement_unit text NOT NULL DEFAULT 'cm';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS free_delivery boolean NOT NULL DEFAULT false;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_variant_id text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_color text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_size_system text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_width numeric;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_length numeric;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS measurement_unit text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS free_delivery boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.wearza_validate_listing_variants() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v jsonb; ids text[] := '{}'; combos text[] := '{}'; combo text; min_price numeric; total_stock integer := 0;
BEGIN
  IF NEW.product_type NOT IN ('clothing','shoes','other') THEN RAISE EXCEPTION 'Choose clothing, shoes or other.'; END IF;
  IF NEW.measurement_unit NOT IN ('cm','in') THEN RAISE EXCEPTION 'Choose cm or inches for measurements.'; END IF;
  IF (NEW.product_type = 'clothing' AND NEW.size_system NOT IN ('letter','international','waist_in','age','one_size')) OR (NEW.product_type = 'shoes' AND NEW.size_system NOT IN ('EU','UK','US','cm')) OR (NEW.product_type = 'other' AND NEW.size_system NOT IN ('one_size','custom')) THEN RAISE EXCEPTION 'Choose a size system suitable for this product type.'; END IF;
  IF jsonb_typeof(NEW.variants) <> 'array' OR jsonb_array_length(NEW.variants) > 200 THEN RAISE EXCEPTION 'Variants must be a list of up to 200 options.'; END IF;
  FOR v IN SELECT value FROM jsonb_array_elements(NEW.variants) LOOP
    IF jsonb_typeof(v) <> 'object' OR coalesce(trim(v->>'id'),'') = '' OR coalesce(trim(v->>'size'),'') = '' OR coalesce(trim(v->>'color'),'') = '' THEN RAISE EXCEPTION 'Every option needs an ID, size and color.'; END IF;
    IF v->>'id' = ANY(ids) THEN RAISE EXCEPTION 'Variant IDs must be unique.'; END IF;
    combo := lower(trim(v->>'size')) || '|' || lower(trim(v->>'color'));
    IF combo = ANY(combos) THEN RAISE EXCEPTION 'Each size and color combination must be unique.'; END IF;
    ids := array_append(ids, v->>'id'); combos := array_append(combos, combo);
    IF jsonb_typeof(v->'price') IS DISTINCT FROM 'number' OR (v->>'price')::numeric <= 0 THEN RAISE EXCEPTION 'Every variant price must be greater than zero.'; END IF;
    IF jsonb_typeof(v->'stock') IS DISTINCT FROM 'number' OR (v->>'stock')::numeric < 0 OR trunc((v->>'stock')::numeric) <> (v->>'stock')::numeric THEN RAISE EXCEPTION 'Variant stock must be a non-negative whole number.'; END IF;
    IF v->>'width' IS NOT NULL AND (jsonb_typeof(v->'width') <> 'number' OR (v->>'width')::numeric <= 0) THEN RAISE EXCEPTION 'Width must be positive when provided.'; END IF;
    IF v->>'length' IS NOT NULL AND (jsonb_typeof(v->'length') <> 'number' OR (v->>'length')::numeric <= 0) THEN RAISE EXCEPTION 'Length must be positive when provided.'; END IF;
    min_price := least(min_price, (v->>'price')::numeric); total_stock := total_stock + (v->>'stock')::integer;
  END LOOP;
  IF jsonb_array_length(NEW.variants) > 0 THEN NEW.real_price := min_price; NEW.stock := total_stock; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER wearza_listing_variants BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.wearza_validate_listing_variants();

CREATE OR REPLACE FUNCTION public.wearza_snapshot_order_variant() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p public.products%ROWTYPE; v jsonb;
BEGIN
  SELECT * INTO p FROM public.products WHERE id = NEW.product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'This product is no longer available.'; END IF;
  IF NOT p.is_active OR NOT EXISTS (SELECT 1 FROM public.sellers WHERE id = p.seller_id AND status = 'approved') THEN RAISE EXCEPTION 'This listing is not available.'; END IF;
  IF NEW.seller_id <> p.seller_id THEN RAISE EXCEPTION 'The product does not belong to this shop.'; END IF;
  IF NEW.quantity < 1 THEN RAISE EXCEPTION 'Quantity must be positive.'; END IF;
  IF jsonb_array_length(p.variants) > 0 THEN
    SELECT value INTO v FROM jsonb_array_elements(p.variants) WHERE value->>'id' = NEW.selected_variant_id;
    IF v IS NULL THEN RAISE EXCEPTION 'Choose a saved size and color option.'; END IF;
    IF NEW.quantity > (v->>'stock')::integer THEN RAISE EXCEPTION 'Not enough stock for this size and color.'; END IF;
    IF NEW.unit_price <> (v->>'price')::numeric THEN RAISE EXCEPTION 'The option price changed. Refresh your cart.'; END IF;
    NEW.selected_size := v->>'size'; NEW.selected_color := v->>'color'; NEW.selected_size_system := p.size_system;
    NEW.selected_width := (v->>'width')::numeric; NEW.selected_length := (v->>'length')::numeric; NEW.measurement_unit := p.measurement_unit;
  ELSE
    IF NEW.quantity > p.stock OR NEW.unit_price <> p.real_price THEN RAISE EXCEPTION 'Price or availability changed. Refresh your cart.'; END IF;
    NEW.selected_variant_id := NULL;
  END IF;
  NEW.free_delivery := p.free_delivery; NEW.total_price := NEW.unit_price * NEW.quantity;
  RETURN NEW;
END;
$$;
CREATE TRIGGER wearza_order_variant_snapshot BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.wearza_snapshot_order_variant();

CREATE OR REPLACE FUNCTION public.wearza_find_order(_order_number text, _phone text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public AS $$
SELECT jsonb_build_object('id', o.id, 'order_number', o.order_number, 'status', o.status, 'subtotal', o.subtotal, 'total', o.total, 'promo_discount', o.promo_discount, 'payment_method', o.payment_method, 'created_at', o.created_at, 'updated_at', o.updated_at, 'processing_at', o.processing_at, 'confirmed_at', o.confirmed_at, 'delivered_at', o.delivered_at, 'cancelled_at', o.cancelled_at, 'cancelled_by', o.cancelled_by, 'cancellation_reason', o.cancellation_reason, 'order_items', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'product_id', i.product_id, 'product_name', i.product_name, 'product_image', i.product_image, 'selected_size', i.selected_size, 'selected_color', i.selected_color, 'selected_variant_id', i.selected_variant_id, 'selected_size_system', i.selected_size_system, 'selected_width', i.selected_width, 'selected_length', i.selected_length, 'measurement_unit', i.measurement_unit, 'free_delivery', i.free_delivery, 'quantity', i.quantity, 'unit_price', i.unit_price, 'total_price', i.total_price)) FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb))
FROM public.orders o WHERE upper(o.order_number) = upper(trim(_order_number)) AND regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g') AND length(regexp_replace(_phone, '\D', '', 'g')) >= 7 LIMIT 1;
$$;
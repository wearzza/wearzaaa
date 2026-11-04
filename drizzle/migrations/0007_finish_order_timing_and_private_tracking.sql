ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS processing_at timestamptz;
CREATE OR REPLACE FUNCTION public.wearza_record_processing_time() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.status = 'processing' AND OLD.status IS DISTINCT FROM NEW.status THEN NEW.processing_at := COALESCE(OLD.processing_at, now()); END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER wearza_processing_time BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.wearza_record_processing_time();
CREATE OR REPLACE FUNCTION public.wearza_find_order(_order_number text, _phone text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT jsonb_build_object('id', o.id, 'order_number', o.order_number, 'status', o.status, 'subtotal', o.subtotal, 'total', o.total, 'promo_discount', o.promo_discount, 'payment_method', o.payment_method, 'created_at', o.created_at, 'updated_at', o.updated_at, 'processing_at', o.processing_at, 'confirmed_at', o.confirmed_at, 'delivered_at', o.delivered_at, 'cancelled_at', o.cancelled_at, 'cancelled_by', o.cancelled_by, 'cancellation_reason', o.cancellation_reason, 'order_items', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'product_id', i.product_id, 'product_name', i.product_name, 'product_image', i.product_image, 'selected_size', i.selected_size, 'quantity', i.quantity, 'unit_price', i.unit_price, 'total_price', i.total_price)) FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb))
 FROM public.orders o
 WHERE upper(o.order_number) = upper(trim(_order_number))
 AND regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
 AND length(regexp_replace(_phone, '\D', '', 'g')) >= 7
 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.wearza_find_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wearza_find_order(text, text) TO anon, authenticated, service_role;
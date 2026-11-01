CREATE OR REPLACE FUNCTION public.wearza_tracked_order(_order_id uuid, _token text) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
 SELECT to_jsonb(o) - 'management_token_hash' || jsonb_build_object('order_items', coalesce((SELECT jsonb_agg(to_jsonb(i)) FROM public.order_items i WHERE i.order_id=o.id),'[]'::jsonb)) FROM public.orders o WHERE o.id=_order_id AND o.management_token_hash=md5(_token) AND length(_token)>=32;
$$;
REVOKE ALL ON FUNCTION public.wearza_tracked_order(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wearza_tracked_order(uuid,text) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.wearza_cancel_customer_order(_order_id uuid, _token text, _reason text, _details text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
 IF length(coalesce(_token,'')) < 32 THEN RAISE EXCEPTION 'Order tracking access is required.'; END IF;
 IF _reason NOT IN ('changed_mind','wrong_size','wrong_address','duplicate','delivery_time','other') OR _reason IS NULL THEN RAISE EXCEPTION 'Choose a cancellation reason.'; END IF;
 UPDATE public.orders SET status='cancelled',cancelled_by='customer',cancellation_reason=_reason,cancellation_details=nullif(trim(_details),''),updated_at=now() WHERE id=_order_id AND management_token_hash=md5(_token) AND status IN ('pending','processing');
 IF NOT FOUND THEN RAISE EXCEPTION 'This order cannot be cancelled. It may already be confirmed. Refresh your orders.'; END IF;
 SELECT public.wearza_tracked_order(_order_id,_token) INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.wearza_cancel_customer_order(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wearza_cancel_customer_order(uuid,text,text,text) TO anon, authenticated;
COMMENT ON COLUMN public.orders.management_token_hash IS 'One-way hash of an unguessable guest tracking token; raw tokens remain on the ordering device.';
CREATE OR REPLACE FUNCTION public.wearza_find_order(_order_number text, _phone text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_jsonb(o) - 'management_token_hash' - 'customer_address' - 'map_url' || jsonb_build_object('order_items', COALESCE((SELECT jsonb_agg(to_jsonb(i)) FROM order_items i WHERE i.order_id = o.id), '[]'::jsonb))
  FROM orders o
  WHERE upper(o.order_number) = upper(trim(_order_number))
    AND regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
    AND length(regexp_replace(_phone, '\D', '', 'g')) >= 7
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.wearza_find_order(text, text) TO anon, authenticated;
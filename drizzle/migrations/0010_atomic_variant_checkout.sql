CREATE OR REPLACE FUNCTION public.wearza_place_order(_customer jsonb, _seller_id uuid, _items jsonb, _token_hash text, _promo_code text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p public.products%ROWTYPE; o public.orders%ROWTYPE; entry jsonb; v jsonb; promo public.promo_codes%ROWTYPE; lines jsonb := '[]'::jsonb; line jsonb; subtotal numeric := 0; discount numeric := 0; price numeric; qty integer; variant_id text; keys text[] := '{}'; line_key text;
BEGIN
  IF coalesce(trim(_customer->>'name'),'') = '' OR coalesce(trim(_customer->>'phone'),'') = '' OR coalesce(trim(_customer->>'address'),'') = '' OR coalesce(trim(_customer->>'province'),'') = '' OR coalesce(trim(_customer->>'district'),'') = '' OR coalesce(trim(_customer->>'municipality'),'') = '' OR coalesce((_customer->>'ward_number')::integer,0) < 1 THEN RAISE EXCEPTION 'Complete the delivery information.'; END IF;
  IF _token_hash IS NULL OR _token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'A valid tracking key is required.'; END IF;
  IF jsonb_typeof(_items) IS DISTINCT FROM 'array' OR jsonb_array_length(_items) < 1 OR jsonb_array_length(_items) > 200 THEN RAISE EXCEPTION 'Choose at least one item.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sellers WHERE id=_seller_id AND status='approved') THEN RAISE EXCEPTION 'This shop is unavailable.'; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(_items) ORDER BY value->>'product_id' LOOP
    SELECT * INTO p FROM public.products WHERE id=(entry->>'product_id')::uuid AND seller_id=_seller_id FOR SHARE;
    IF NOT FOUND OR NOT p.is_active THEN RAISE EXCEPTION 'A product is no longer available.'; END IF;
    IF jsonb_typeof(entry->'quantity') IS DISTINCT FROM 'number' OR (entry->>'quantity')::numeric <> trunc((entry->>'quantity')::numeric) THEN RAISE EXCEPTION 'Quantity must be a whole number.'; END IF;
    qty := (entry->>'quantity')::integer;
    variant_id := nullif(entry->>'variant_id','');
    line_key := p.id::text || '|' || coalesce(variant_id,'');
    IF line_key = ANY(keys) THEN RAISE EXCEPTION 'Combine duplicate size and color options.'; END IF;
    keys := array_append(keys,line_key);
    IF jsonb_array_length(p.variants)>0 THEN
      SELECT value INTO v FROM jsonb_array_elements(p.variants) WHERE value->>'id'=variant_id;
      IF v IS NULL THEN RAISE EXCEPTION 'A size or color option is no longer available.'; END IF;
      price := (v->>'price')::numeric;
      IF qty < 1 OR qty > (v->>'stock')::integer THEN RAISE EXCEPTION 'Not enough stock for the selected option.'; END IF;
    ELSE
      price := p.real_price;
      IF qty < 1 OR qty > p.stock THEN RAISE EXCEPTION 'Not enough product stock.'; END IF;
      variant_id := NULL;
    END IF;
    IF (entry->>'expected_price')::numeric IS DISTINCT FROM price THEN RAISE EXCEPTION 'The price changed. Refresh your cart before ordering.'; END IF;
    subtotal := subtotal + price * qty;
    lines := lines || jsonb_build_array(jsonb_build_object('product_id',p.id,'product_name',p.name,'product_image',p.image_urls[1],'quantity',qty,'unit_price',price,'variant_id',variant_id,'selected_size',entry->>'selected_size'));
  END LOOP;
  IF coalesce(trim(_promo_code),'')<>'' THEN
    SELECT * INTO promo FROM public.promo_codes WHERE code=upper(trim(_promo_code)) AND is_active AND (seller_id IS NULL OR seller_id=_seller_id) AND (expires_at IS NULL OR expires_at>now()) AND (max_usage IS NULL OR usage_count<max_usage) LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'This promo is not available for this shop.'; END IF;
    discount := round(subtotal * least(100,greatest(0,promo.discount_percent))/100);
  END IF;
  INSERT INTO public.orders(customer_name,customer_phone,customer_address,customer_location,province,district,municipality,ward_number,map_url,seller_id,promo_code,promo_discount,subtotal,total,payment_method,notes,status,management_token_hash)
  VALUES (_customer->>'name',_customer->>'phone',_customer->>'address',concat(_customer->>'municipality','-',_customer->>'ward_number',', ',_customer->>'district',', ',_customer->>'province'),_customer->>'province',_customer->>'district',_customer->>'municipality',(_customer->>'ward_number')::integer,nullif(_customer->>'map_url',''),_seller_id,promo.code,discount,subtotal,greatest(0,subtotal-discount),'cod',nullif(_customer->>'notes',''),'pending',_token_hash) RETURNING * INTO o;
  FOR line IN SELECT value FROM jsonb_array_elements(lines) LOOP
    INSERT INTO public.order_items(order_id,product_id,product_name,product_image,seller_id,selected_variant_id,selected_size,quantity,unit_price,total_price)
    VALUES(o.id,(line->>'product_id')::uuid,line->>'product_name',line->>'product_image',_seller_id,line->>'variant_id',line->>'selected_size',(line->>'quantity')::integer,(line->>'unit_price')::numeric,(line->>'quantity')::integer*(line->>'unit_price')::numeric);
  END LOOP;
  RETURN jsonb_build_object('id',o.id,'order_number',o.order_number,'subtotal',o.subtotal,'total',o.total);
END;
$$;
REVOKE ALL ON FUNCTION public.wearza_place_order(jsonb,uuid,jsonb,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wearza_place_order(jsonb,uuid,jsonb,text,text) TO anon, authenticated, service_role;
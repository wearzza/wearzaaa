CREATE OR REPLACE FUNCTION public.wearza_set_order_number() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE candidate text;
BEGIN
  LOOP
    candidate := 'WZ-' || to_char(now() AT TIME ZONE 'Asia/Kathmandu', 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = candidate);
  END LOOP;
  NEW.order_number := candidate;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS wearza_order_number ON public.orders;
CREATE TRIGGER wearza_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.wearza_set_order_number();
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique ON public.orders (order_number);
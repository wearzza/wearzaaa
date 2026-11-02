CREATE OR REPLACE FUNCTION public.wearza_enforce_commission() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.commission_rate := 10;
  RETURN NEW;
END; $$;
CREATE TRIGGER wearza_commission_rate BEFORE INSERT OR UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.wearza_enforce_commission();

CREATE OR REPLACE FUNCTION public.wearza_validate_order_change() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending' THEN RAISE EXCEPTION 'New orders must start as pending.'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF OLD.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'Completed orders cannot change status.'; END IF;
  IF NOT (
    NEW.status = 'cancelled'
    OR (OLD.status = 'pending' AND NEW.status IN ('processing','confirmed'))
    OR (OLD.status = 'processing' AND NEW.status = 'confirmed')
    OR (OLD.status IN ('confirmed','shipped') AND NEW.status = 'delivered')
  ) THEN RAISE EXCEPTION 'Choose the next valid order status. Confirm the order before delivery.'; END IF;
  IF NEW.status = 'confirmed' THEN NEW.confirmed_at := now(); END IF;
  IF NEW.status = 'delivered' THEN NEW.delivered_at := now(); END IF;
  IF NEW.status = 'cancelled' THEN
    IF NEW.cancelled_by IS NULL OR NEW.cancelled_by NOT IN ('customer','seller') THEN RAISE EXCEPTION 'Select who cancelled this order.'; END IF;
    IF NEW.cancellation_reason IS NULL OR
      (NEW.cancelled_by = 'customer' AND NEW.cancellation_reason NOT IN ('changed_mind','wrong_size','wrong_address','duplicate','delivery_time','other')) OR
      (NEW.cancelled_by = 'seller' AND NEW.cancellation_reason NOT IN ('out_of_stock','cannot_deliver','customer_request','other')) THEN RAISE EXCEPTION 'Choose a valid cancellation reason.'; END IF;
    IF NEW.cancellation_reason = 'other' AND length(trim(coalesce(NEW.cancellation_details,''))) < 5 THEN RAISE EXCEPTION 'Please explain the cancellation reason.'; END IF;
    IF length(coalesce(NEW.cancellation_details,'')) > 500 THEN RAISE EXCEPTION 'Cancellation details must be 500 characters or fewer.'; END IF;
    IF NEW.cancelled_by = 'customer' AND OLD.status NOT IN ('pending','processing') THEN RAISE EXCEPTION 'This order has been confirmed and can no longer be cancelled by the customer.'; END IF;
    NEW.cancelled_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER wearza_order_initial_status BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.wearza_validate_order_change();
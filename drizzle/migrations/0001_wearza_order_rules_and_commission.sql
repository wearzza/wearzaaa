ALTER TABLE public.sellers ALTER COLUMN commission_rate SET DEFAULT 10;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS self_delivery boolean NOT NULL DEFAULT false;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS refund_policy_agreed boolean NOT NULL DEFAULT false;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS policy_version text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS policies_accepted_at timestamptz;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','processing','confirmed','shipped','delivered','cancelled'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_details text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS management_token_hash text;
CREATE OR REPLACE FUNCTION public.wearza_validate_order_change() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'Completed orders cannot change status.'; END IF;
    IF OLD.status IN ('confirmed','shipped') AND NEW.status IN ('pending','processing') THEN RAISE EXCEPTION 'Confirmed orders cannot return to pending or processing.'; END IF;
    IF OLD.status = 'processing' AND NEW.status = 'pending' THEN RAISE EXCEPTION 'Processing orders cannot return to pending.'; END IF;
    IF OLD.status IN ('pending','processing') AND NEW.status IN ('delivered','shipped') THEN RAISE EXCEPTION 'Confirm the order before marking it delivered.'; END IF;
    IF NEW.status = 'confirmed' THEN NEW.confirmed_at := now(); END IF;
    IF NEW.status = 'delivered' THEN NEW.delivered_at := now(); END IF;
    IF NEW.status = 'cancelled' THEN
      IF NEW.cancelled_by NOT IN ('customer','seller') OR NEW.cancelled_by IS NULL THEN RAISE EXCEPTION 'Select who cancelled this order.'; END IF;
      IF NEW.cancellation_reason IS NULL OR NEW.cancellation_reason NOT IN ('changed_mind','wrong_size','wrong_address','duplicate','delivery_time','other','out_of_stock','cannot_deliver','customer_request') THEN RAISE EXCEPTION 'Choose a valid cancellation reason.'; END IF;
      IF NEW.cancellation_reason = 'other' AND length(trim(coalesce(NEW.cancellation_details,''))) < 5 THEN RAISE EXCEPTION 'Please explain the cancellation reason.'; END IF;
      IF length(coalesce(NEW.cancellation_details,'')) > 500 THEN RAISE EXCEPTION 'Cancellation details must be 500 characters or fewer.'; END IF;
      IF NEW.cancelled_by = 'customer' AND OLD.status NOT IN ('pending','processing') THEN RAISE EXCEPTION 'This order has been confirmed and can no longer be cancelled by the customer.'; END IF;
      NEW.cancelled_at := now();
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER wearza_order_change BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.wearza_validate_order_change();
CREATE OR REPLACE FUNCTION public.wearza_validate_seller_signup() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT NEW.self_delivery OR NOT NEW.terms_agreed OR NOT NEW.terms_business_agreed OR NOT NEW.terms_legal_agreed OR NOT NEW.refund_policy_agreed OR NEW.policy_version IS NULL THEN
    RAISE EXCEPTION 'Self-delivery and all seller agreements must be accepted before signup.';
  END IF;
  NEW.policies_accepted_at := now();
  NEW.commission_rate := 10;
  RETURN NEW;
END; $$;
CREATE TRIGGER wearza_seller_signup BEFORE INSERT ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.wearza_validate_seller_signup();
CREATE TABLE public.commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  screenshot_url text NOT NULL,
  reference text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_payments TO anon, authenticated;
GRANT ALL ON public.commission_payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_all ON public.commission_payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY as_all ON public.app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
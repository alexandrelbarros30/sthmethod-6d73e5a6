
ALTER TABLE public.billing_campaigns
  ADD COLUMN IF NOT EXISTS auto_send boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.billing_automation (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO public.billing_automation (id, enabled) VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.billing_automation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read automation" ON public.billing_automation;
CREATE POLICY "Anyone authenticated can read automation"
ON public.billing_automation FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can update automation" ON public.billing_automation;
CREATE POLICY "Only admins can update automation"
ON public.billing_automation FOR UPDATE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

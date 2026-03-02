
-- Table to store manual payment links per plan
CREATE TABLE public.plan_payment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  pix_code TEXT DEFAULT '',
  pix_enabled BOOLEAN NOT NULL DEFAULT false,
  card_link TEXT DEFAULT '',
  card_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id)
);

ALTER TABLE public.plan_payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment links" ON public.plan_payment_links FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view payment links" ON public.plan_payment_links FOR SELECT USING (true);

CREATE TRIGGER update_plan_payment_links_updated_at
  BEFORE UPDATE ON public.plan_payment_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

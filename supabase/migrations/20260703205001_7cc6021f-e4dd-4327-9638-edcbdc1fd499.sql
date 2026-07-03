-- Whitelist do canal Fale com o Nutri (exceções manuais)
CREATE TABLE public.crm_nutri_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_nutri_whitelist TO authenticated;
GRANT ALL ON public.crm_nutri_whitelist TO service_role;

ALTER TABLE public.crm_nutri_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM staff can view whitelist"
  ON public.crm_nutri_whitelist FOR SELECT
  TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "Admins can manage whitelist"
  ON public.crm_nutri_whitelist FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_crm_nutri_whitelist_updated
  BEFORE UPDATE ON public.crm_nutri_whitelist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_crm_nutri_whitelist_phone ON public.crm_nutri_whitelist(phone);
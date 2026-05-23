
-- Billing campaigns: one row per student in a renewal billing cycle
CREATE TABLE public.billing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id UUID,
  plan_id UUID,
  end_date DATE NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 6),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','renewed','ignored','reactivated')),
  last_charged_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responsible_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_billing_campaigns_next_due ON public.billing_campaigns(next_due_at) WHERE status = 'active';
CREATE INDEX idx_billing_campaigns_user ON public.billing_campaigns(user_id);

ALTER TABLE public.billing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can manage billing campaigns"
ON public.billing_campaigns FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'admin_viewer')
  OR public.has_role(auth.uid(), 'assistente')
  OR public.has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'assistente')
  OR public.has_role(auth.uid(), 'financeiro')
);

CREATE POLICY "Consultants can manage their students' campaigns"
ON public.billing_campaigns FOR ALL TO authenticated
USING (public.is_consultant_of(auth.uid(), user_id))
WITH CHECK (public.is_consultant_of(auth.uid(), user_id));

CREATE TRIGGER update_billing_campaigns_updated_at
BEFORE UPDATE ON public.billing_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Billing charges: full history of every charge sent
CREATE TABLE public.billing_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.billing_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stage INTEGER NOT NULL,
  template_key TEXT,
  responsible_user_id UUID,
  phone TEXT,
  message TEXT,
  image_url TEXT,
  document_url TEXT,
  document_name TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent','failed','manual')),
  delivery_error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_charges_user ON public.billing_charges(user_id, sent_at DESC);
CREATE INDEX idx_billing_charges_campaign ON public.billing_charges(campaign_id);

ALTER TABLE public.billing_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can manage billing charges"
ON public.billing_charges FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'admin_viewer')
  OR public.has_role(auth.uid(), 'assistente')
  OR public.has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'assistente')
  OR public.has_role(auth.uid(), 'financeiro')
);

CREATE POLICY "Consultants can manage their students' charges"
ON public.billing_charges FOR ALL TO authenticated
USING (public.is_consultant_of(auth.uid(), user_id))
WITH CHECK (public.is_consultant_of(auth.uid(), user_id));

-- Function to advance a campaign to next stage after a charge is sent
CREATE OR REPLACE FUNCTION public.advance_billing_campaign(_campaign_id UUID)
RETURNS public.billing_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_camp public.billing_campaigns;
  v_gap_days INTEGER;
  v_new_stage INTEGER;
  v_new_status TEXT;
BEGIN
  SELECT * INTO v_camp FROM public.billing_campaigns WHERE id = _campaign_id;
  IF v_camp.id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  -- Gap until next charge based on the stage we JUST completed
  v_gap_days := CASE v_camp.stage
    WHEN 1 THEN 7
    WHEN 2 THEN 8
    WHEN 3 THEN 15
    WHEN 4 THEN 30
    ELSE NULL
  END;

  IF v_camp.stage >= 5 THEN
    v_new_stage := 5;
    v_new_status := 'reactivated';
  ELSE
    v_new_stage := v_camp.stage + 1;
    v_new_status := 'active';
  END IF;

  UPDATE public.billing_campaigns
  SET stage = v_new_stage,
      status = v_new_status,
      last_charged_at = now(),
      next_due_at = CASE WHEN v_gap_days IS NULL THEN now() + interval '365 days'
                         ELSE now() + (v_gap_days || ' days')::interval END,
      updated_at = now()
  WHERE id = _campaign_id
  RETURNING * INTO v_camp;

  RETURN v_camp;
END;
$$;

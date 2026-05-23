
CREATE TABLE IF NOT EXISTS public.crm_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_id uuid REFERENCES public.crm_templates(id) ON DELETE SET NULL,
  segment_id uuid REFERENCES public.crm_segments(id) ON DELETE SET NULL,
  media_ids text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_check_at timestamptz,
  run_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  scope text NOT NULL DEFAULT 'admin',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_automations_active ON public.crm_automations(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_crm_automations_created_by ON public.crm_automations(created_by);

ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all automations"
  ON public.crm_automations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultores manage own automations"
  ON public.crm_automations FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE TRIGGER trg_crm_automations_updated
  BEFORE UPDATE ON public.crm_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.crm_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.crm_automations(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  matched_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  context jsonb DEFAULT '{}'::jsonb,
  error text
);

CREATE INDEX IF NOT EXISTS idx_crm_automation_runs_automation ON public.crm_automation_runs(automation_id, triggered_at DESC);

ALTER TABLE public.crm_automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all automation runs"
  ON public.crm_automation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners view own automation runs"
  ON public.crm_automation_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.crm_automations a WHERE a.id = automation_id AND a.created_by = auth.uid()));

CREATE POLICY "Service role inserts automation runs"
  ON public.crm_automation_runs FOR INSERT TO authenticated
  WITH CHECK (true);

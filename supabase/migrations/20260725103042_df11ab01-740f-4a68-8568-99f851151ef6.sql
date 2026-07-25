
CREATE TABLE public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_by_name text,
  title text NOT NULL,
  body text,
  url text,
  tag text,
  audience_type text NOT NULL CHECK (audience_type IN ('active','inactive','all','custom')),
  audience_user_ids uuid[] NOT NULL DEFAULT '{}',
  target_count integer NOT NULL DEFAULT 0,
  use_variables boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','completed','failed','canceled')),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  subscriptions_reached integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_campaigns TO authenticated;
GRANT ALL ON public.push_campaigns TO service_role;

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/consultors read campaigns"
  ON public.push_campaigns FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultor'::app_role));

CREATE POLICY "Admins/consultors insert campaigns"
  ON public.push_campaigns FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultor'::app_role))
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins/consultors update campaigns"
  ON public.push_campaigns FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultor'::app_role));

CREATE POLICY "Admins delete campaigns"
  ON public.push_campaigns FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_push_campaigns_status ON public.push_campaigns(status);
CREATE INDEX idx_push_campaigns_scheduled ON public.push_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_push_campaigns_created_at ON public.push_campaigns(created_at DESC);

CREATE TRIGGER trg_push_campaigns_updated_at
  BEFORE UPDATE ON public.push_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================================
-- CRM Campaigns — Fase 1: Fundação
-- =====================================================================

-- Helper: is admin or admin_viewer (already exists as has_admin_view)
-- Helper: is consultor (use has_role)

-- ---------- crm_segments ----------
CREATE TABLE public.crm_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  scope TEXT NOT NULL DEFAULT 'admin' CHECK (scope IN ('admin','consultor','shared')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all segments" ON public.crm_segments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Consultores view shared and own segments" ON public.crm_segments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'consultor') AND (scope = 'shared' OR created_by = auth.uid()));

CREATE POLICY "Consultores manage own segments" ON public.crm_segments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'consultor') AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'consultor') AND created_by = auth.uid());

-- ---------- crm_media ----------
CREATE TABLE public.crm_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  file_path TEXT,
  type TEXT NOT NULL CHECK (type IN ('image','video','pdf','document')),
  mime_type TEXT,
  size_bytes BIGINT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  title TEXT,
  description TEXT,
  favorite BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view media" ON public.crm_media
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'));

CREATE POLICY "Admins manage media" ON public.crm_media
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Consultores manage own media" ON public.crm_media
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'consultor') AND uploaded_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'consultor') AND uploaded_by = auth.uid());

-- ---------- crm_templates ----------
CREATE TABLE public.crm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('comercial','relacionamento','estrategico','conteudo')),
  subcategory TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  preview_text TEXT,
  variables TEXT[] DEFAULT '{}',
  media_ids UUID[] DEFAULT '{}',
  scope TEXT NOT NULL DEFAULT 'shared' CHECK (scope IN ('admin','consultor','shared')),
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view templates" ON public.crm_templates
  FOR SELECT TO authenticated
  USING (
    (public.has_role(auth.uid(),'admin'))
    OR (public.has_role(auth.uid(),'consultor') AND (scope IN ('shared','consultor') OR created_by = auth.uid()))
  );

CREATE POLICY "Admins manage templates" ON public.crm_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Consultores manage own templates" ON public.crm_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'consultor') AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'consultor') AND created_by = auth.uid());

-- ---------- crm_campaigns ----------
CREATE TABLE public.crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  segment_id UUID REFERENCES public.crm_segments(id) ON DELETE SET NULL,
  segment_snapshot JSONB,
  template_id UUID REFERENCES public.crm_templates(id) ON DELETE SET NULL,
  template_snapshot JSONB,
  media_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','paused','failed','cancelled')),
  scheduled_at TIMESTAMPTZ,
  recurrence JSONB,
  next_run_at TIMESTAMPTZ,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  response_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  scope TEXT NOT NULL DEFAULT 'admin' CHECK (scope IN ('admin','consultor')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all campaigns" ON public.crm_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Consultores manage own campaigns" ON public.crm_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'consultor') AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'consultor') AND created_by = auth.uid());

CREATE INDEX idx_crm_campaigns_status ON public.crm_campaigns(status);
CREATE INDEX idx_crm_campaigns_next_run ON public.crm_campaigns(next_run_at) WHERE status IN ('scheduled','sending');

-- ---------- crm_campaign_runs ----------
CREATE TABLE public.crm_campaign_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  triggered_by UUID,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual','scheduled','recurring')),
  error TEXT
);
ALTER TABLE public.crm_campaign_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all runs" ON public.crm_campaign_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Consultores view own runs" ON public.crm_campaign_runs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'consultor')
    AND EXISTS (SELECT 1 FROM public.crm_campaigns c WHERE c.id = campaign_id AND c.created_by = auth.uid())
  );

CREATE INDEX idx_crm_campaign_runs_campaign ON public.crm_campaign_runs(campaign_id, started_at DESC);

-- ---------- crm_campaign_messages ----------
CREATE TABLE public.crm_campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.crm_campaign_runs(id) ON DELETE SET NULL,
  recipient_user_id UUID,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  rendered_content TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed','skipped')),
  error TEXT,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all messages" ON public.crm_campaign_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Consultores view own messages" ON public.crm_campaign_messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'consultor')
    AND EXISTS (SELECT 1 FROM public.crm_campaigns c WHERE c.id = campaign_id AND c.created_by = auth.uid())
  );

CREATE INDEX idx_crm_campaign_messages_campaign ON public.crm_campaign_messages(campaign_id, created_at DESC);
CREATE INDEX idx_crm_campaign_messages_status ON public.crm_campaign_messages(status);

-- ---------- updated_at triggers ----------
CREATE TRIGGER trg_crm_segments_updated BEFORE UPDATE ON public.crm_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_media_updated BEFORE UPDATE ON public.crm_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_templates_updated BEFORE UPDATE ON public.crm_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_campaigns_updated BEFORE UPDATE ON public.crm_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-media','crm-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read crm-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crm-media');

CREATE POLICY "Staff upload crm-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'crm-media'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'))
  );

CREATE POLICY "Staff update own crm-media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'crm-media'
    AND (public.has_role(auth.uid(),'admin') OR owner = auth.uid())
  );

CREATE POLICY "Staff delete own crm-media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'crm-media'
    AND (public.has_role(auth.uid(),'admin') OR owner = auth.uid())
  );

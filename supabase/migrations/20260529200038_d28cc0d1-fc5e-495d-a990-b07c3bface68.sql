-- =========================================
-- STH AI ENGINE
-- =========================================

CREATE TABLE public.sth_ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,       -- dieta, treino, protocolo, exames, atualizacao, pagamento, renovacao, cancelamento, duvida_geral, conversao
  engine TEXT NOT NULL DEFAULT 'humanizada' CHECK (engine IN ('rapida','humanizada','consultor','conversao','retencao','renovacao')),
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  uses_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sth_ai_templates_active ON public.sth_ai_templates(active, category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_ai_templates TO authenticated;
GRANT ALL ON public.sth_ai_templates TO service_role;
ALTER TABLE public.sth_ai_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view templates" ON public.sth_ai_templates FOR SELECT TO authenticated
USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));
CREATE POLICY "Staff manage templates" ON public.sth_ai_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'));

CREATE TRIGGER trg_sth_ai_templates_updated BEFORE UPDATE ON public.sth_ai_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drafts (resposta aguardando aprovação humana)
CREATE TABLE public.sth_ai_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES public.sth_memory(id) ON DELETE SET NULL,
  ticket_id UUID,
  phone TEXT,
  contact_name TEXT,
  contact_type TEXT,            -- lead, aluno_ativo, aluno_inativo, renovacao, financeiro, suporte, duvida_tecnica
  intent TEXT,                  -- dieta, treino, protocolo, exames, atualizacao, pagamento, renovacao, cancelamento, duvida_geral, conversao
  engine TEXT NOT NULL DEFAULT 'humanizada' CHECK (engine IN ('rapida','humanizada','consultor','conversao','retencao','renovacao')),
  inbound_text TEXT,
  draft_text TEXT NOT NULL,
  final_text TEXT,
  template_id UUID REFERENCES public.sth_ai_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','sent','rejected','edited')),
  confidence NUMERIC(4,2),
  model TEXT,
  latency_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  rejected_reason TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sth_ai_drafts_status ON public.sth_ai_drafts(status, created_at DESC);
CREATE INDEX idx_sth_ai_drafts_memory ON public.sth_ai_drafts(memory_id);
CREATE INDEX idx_sth_ai_drafts_phone ON public.sth_ai_drafts(phone);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_ai_drafts TO authenticated;
GRANT ALL ON public.sth_ai_drafts TO service_role;
ALTER TABLE public.sth_ai_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage drafts" ON public.sth_ai_drafts FOR ALL TO authenticated
USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));

CREATE TRIGGER trg_sth_ai_drafts_updated BEFORE UPDATE ON public.sth_ai_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mensagens sem solução
CREATE TABLE public.sth_ai_unsolved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES public.sth_memory(id) ON DELETE SET NULL,
  phone TEXT,
  question TEXT NOT NULL,
  reason TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sth_ai_unsolved_open ON public.sth_ai_unsolved(resolved, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_ai_unsolved TO authenticated;
GRANT ALL ON public.sth_ai_unsolved TO service_role;
ALTER TABLE public.sth_ai_unsolved ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage unsolved" ON public.sth_ai_unsolved FOR ALL TO authenticated
USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));

-- KPI agregada (security definer p/ painel)
CREATE OR REPLACE FUNCTION public.sth_ai_engine_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'pending', (SELECT count(*) FROM public.sth_ai_drafts WHERE status = 'pending'),
    'sent_today', (SELECT count(*) FROM public.sth_ai_drafts WHERE status = 'sent' AND sent_at::date = current_date),
    'sent_30d', (SELECT count(*) FROM public.sth_ai_drafts WHERE status = 'sent' AND sent_at >= now() - interval '30 days'),
    'rejected_30d', (SELECT count(*) FROM public.sth_ai_drafts WHERE status = 'rejected' AND created_at >= now() - interval '30 days'),
    'avg_latency_ms', (SELECT COALESCE(round(avg(latency_ms))::int, 0) FROM public.sth_ai_drafts WHERE created_at >= now() - interval '7 days'),
    'unsolved_open', (SELECT count(*) FROM public.sth_ai_unsolved WHERE NOT resolved),
    'templates_active', (SELECT count(*) FROM public.sth_ai_templates WHERE active),
    'top_intents', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('intent', intent, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (
        SELECT intent, count(*) AS c FROM public.sth_ai_drafts
        WHERE intent IS NOT NULL AND created_at >= now() - interval '30 days'
        GROUP BY intent ORDER BY count(*) DESC LIMIT 8
      ) t
    ),
    'top_templates', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'uses', uses_count, 'success', success_count) ORDER BY uses_count DESC), '[]'::jsonb)
      FROM (
        SELECT id, name, uses_count, success_count FROM public.sth_ai_templates
        WHERE active ORDER BY uses_count DESC LIMIT 6
      ) t
    )
  ) INTO v;
  RETURN v;
END $$;
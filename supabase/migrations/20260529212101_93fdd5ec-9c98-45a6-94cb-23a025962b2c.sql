
-- STH ONE AUTOMATION ENGINE — orchestrator tables

CREATE TABLE IF NOT EXISTS public.sth_auto_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  user_id uuid,
  memory_id uuid,
  channel text DEFAULT 'whatsapp',
  classification text,            -- lead | aluno_ativo | aluno_inativo | renovacao | financeiro
  intent text,                    -- dieta | treino | protocolo | exames | atualizacao | renovacao | financeiro | comercial | duvida
  source text DEFAULT 'inbound',  -- inbound | scheduler | manual
  payload jsonb DEFAULT '{}'::jsonb,
  decision text,                  -- template | base_sth | gemini | human | idle_close
  action_taken text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_auto_events TO authenticated;
GRANT ALL ON public.sth_auto_events TO service_role;
ALTER TABLE public.sth_auto_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_events admin read" ON public.sth_auto_events
  FOR SELECT TO authenticated
  USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));
CREATE POLICY "auto_events admin write" ON public.sth_auto_events
  FOR ALL TO authenticated
  USING (public.has_admin_view(auth.uid()))
  WITH CHECK (public.has_admin_view(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_sth_auto_events_phone ON public.sth_auto_events(phone);
CREATE INDEX IF NOT EXISTS idx_sth_auto_events_created ON public.sth_auto_events(created_at DESC);

CREATE TABLE IF NOT EXISTS public.sth_auto_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  user_id uuid,
  last_inbound_at timestamptz NOT NULL DEFAULT now(),
  last_outbound_at timestamptz,
  status text NOT NULL DEFAULT 'open', -- open | closed_idle | closed_human
  idle_warned boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_auto_sessions TO authenticated;
GRANT ALL ON public.sth_auto_sessions TO service_role;
ALTER TABLE public.sth_auto_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_sessions admin read" ON public.sth_auto_sessions
  FOR SELECT TO authenticated
  USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente'));
CREATE POLICY "auto_sessions admin write" ON public.sth_auto_sessions
  FOR ALL TO authenticated
  USING (public.has_admin_view(auth.uid()))
  WITH CHECK (public.has_admin_view(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_sth_auto_sessions_status ON public.sth_auto_sessions(status, last_inbound_at);

CREATE TABLE IF NOT EXISTS public.sth_auto_score_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid,
  phone text NOT NULL,
  reason text NOT NULL,
  delta integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sth_auto_score_log TO authenticated;
GRANT ALL ON public.sth_auto_score_log TO service_role;
ALTER TABLE public.sth_auto_score_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_score_log admin read" ON public.sth_auto_score_log
  FOR SELECT TO authenticated
  USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor'));
CREATE POLICY "auto_score_log admin write" ON public.sth_auto_score_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_view(auth.uid()));

-- Executive dashboard RPC
CREATE OR REPLACE FUNCTION public.sth_automation_dashboard()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT jsonb_build_object(
    'alunos_ativos', (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date>=current_date),
    'leads_total', (SELECT count(*) FROM public.sth_memory WHERE plan_status IS NULL OR plan_status='lead'),
    'leads_quentes', (SELECT count(*) FROM public.sth_memory WHERE temperature IN ('quente','pronto')),
    'conversoes_30d', (SELECT count(*) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '30 days'),
    'renovacoes_proximas', (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date AND current_date+30),
    'atendimentos_abertos', (SELECT count(*) FROM public.sth_auto_sessions WHERE status='open'),
    'tempo_medio_resposta_ms', (SELECT COALESCE(round(avg(latency_ms))::int,0) FROM public.sth_ai_drafts WHERE created_at >= now() - interval '7 days'),
    'receita_30d', (SELECT COALESCE(SUM(amount),0) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '30 days'),
    'eventos_24h', (SELECT count(*) FROM public.sth_auto_events WHERE created_at >= now() - interval '24 hours'),
    'alertas', (
      SELECT jsonb_build_object(
        'leads_quentes', (SELECT count(*) FROM public.sth_memory WHERE temperature IN ('quente','pronto')),
        'sem_atualizacao', (SELECT count(*) FROM public.sth_memory_alerts WHERE kind='sem_atualizacao' AND NOT resolved),
        'renovacoes', (SELECT count(*) FROM public.sth_memory_alerts WHERE kind='plano_vencendo' AND NOT resolved),
        'atendimento_parado', (SELECT count(*) FROM public.sth_auto_sessions WHERE status='open' AND last_inbound_at < now() - interval '15 minutes'),
        'risco_evasao', (SELECT count(*) FROM public.sth_memory_alerts WHERE kind='risco_desistencia' AND NOT resolved)
      )
    )
  ) INTO v;
  RETURN v;
END $$;

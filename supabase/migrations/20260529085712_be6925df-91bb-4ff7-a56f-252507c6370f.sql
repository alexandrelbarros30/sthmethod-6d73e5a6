
-- Extend crm_contacts with CRM fields
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'novo';

ALTER TABLE public.crm_tickets
  ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- ============ CRM_NOTES ============
CREATE TABLE IF NOT EXISTS public.crm_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  author_id uuid,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_notes_contact ON public.crm_notes(contact_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notes TO authenticated;
GRANT ALL ON public.crm_notes TO service_role;

ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage crm_notes"
  ON public.crm_notes FOR ALL TO authenticated
  USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor'))
  WITH CHECK (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor'));

-- ============ CRM_TAGS catalog ============
CREATE TABLE IF NOT EXISTS public.crm_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#22c55e',
  kind text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tags TO authenticated;
GRANT ALL ON public.crm_tags TO service_role;

ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read crm_tags"
  ON public.crm_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write crm_tags"
  ON public.crm_tags FOR ALL TO authenticated
  USING (public.has_admin_view(auth.uid()))
  WITH CHECK (public.has_admin_view(auth.uid()));

-- Seed a few default tags
INSERT INTO public.crm_tags (name, color, kind) VALUES
  ('Lead Quente', '#ef4444', 'lead'),
  ('Lead Frio', '#3b82f6', 'lead'),
  ('Atualização Pendente', '#f59e0b', 'status'),
  ('Exames Pendentes', '#a855f7', 'status'),
  ('Renovação', '#22c55e', 'status'),
  ('Prioridade Alta', '#dc2626', 'priority'),
  ('Sem Resposta', '#64748b', 'status'),
  ('Aluno VIP', '#fbbf24', 'segment')
ON CONFLICT (name) DO NOTHING;

-- ============ Dashboard stats RPC ============
CREATE OR REPLACE FUNCTION public.sth_crm_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'leads_novos', (SELECT count(*) FROM public.crm_contacts WHERE kind = 'lead' AND created_at >= now() - interval '30 days'),
    'alunos_ativos', (SELECT count(*) FROM public.subscriptions WHERE status = 'active' AND end_date >= current_date),
    'renovacoes_proximas', (SELECT count(*) FROM public.subscriptions WHERE status = 'active' AND end_date BETWEEN current_date AND current_date + 30),
    'atualizacoes_pendentes', (
      SELECT count(*) FROM public.subscriptions s
      WHERE s.status = 'active' AND s.end_date >= current_date
        AND NOT EXISTS (
          SELECT 1 FROM public.weight_logs w
          WHERE w.user_id = s.user_id AND w.logged_at >= now() - interval '29 days'
        )
    ),
    'exames_aguardando', (SELECT count(*) FROM public.documents WHERE doc_type ILIKE '%exam%' AND (status IS NULL OR status <> 'analyzed')),
    'atendimentos_abertos', (SELECT count(*) FROM public.crm_tickets WHERE closed_at IS NULL),
    'prioridade_alta', (SELECT count(*) FROM public.crm_tickets WHERE closed_at IS NULL AND priority IN ('high','sensitive')),
    'oportunidades', (SELECT count(*) FROM public.payments WHERE status = 'pending' AND created_at >= now() - interval '15 days'),
    'total_leads', (SELECT count(*) FROM public.crm_contacts WHERE kind = 'lead'),
    'receita_30d', (SELECT COALESCE(SUM(amount),0) FROM public.payments WHERE status = 'approved' AND created_at >= now() - interval '30 days')
  ) INTO v;

  RETURN v;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sth_crm_dashboard_stats() TO authenticated;

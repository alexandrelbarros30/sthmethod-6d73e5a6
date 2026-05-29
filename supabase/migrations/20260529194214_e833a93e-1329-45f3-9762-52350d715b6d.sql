
-- =========================================
-- STH MEMORY — módulo de memória inteligente
-- =========================================

-- 1) Memória principal (1 row por contato)
CREATE TABLE public.sth_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  user_id UUID,
  full_name TEXT,
  -- Dados básicos
  plan_name TEXT,
  plan_status TEXT,
  objective TEXT,
  -- Físico
  initial_weight NUMERIC,
  current_weight NUMERIC,
  last_physical_update TIMESTAMPTZ,
  photos_count INTEGER NOT NULL DEFAULT 0,
  -- Comportamento
  response_frequency TEXT,          -- alta, media, baixa
  last_seen_at TIMESTAMPTZ,
  difficulties TEXT[],
  preferences TEXT[],
  -- Comunicação
  preferred_tone TEXT,              -- rapido, tecnico, motivacional, humanizado
  preferred_format TEXT,            -- texto, audio, direto, detalhado
  -- Lead
  lead_interest TEXT,
  lead_plan_presented TEXT,
  -- Score / temperatura
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  temperature TEXT NOT NULL DEFAULT 'frio' CHECK (temperature IN ('frio','morno','quente','pronto')),
  -- Histórico resumido
  last_question TEXT,
  last_answer TEXT,
  last_interaction_at TIMESTAMPTZ,
  avg_response_seconds INTEGER,
  -- Meta livre
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sth_memory_user_id ON public.sth_memory(user_id);
CREATE INDEX idx_sth_memory_temperature ON public.sth_memory(temperature);
CREATE INDEX idx_sth_memory_score ON public.sth_memory(score DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_memory TO authenticated;
GRANT ALL ON public.sth_memory TO service_role;

ALTER TABLE public.sth_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view memory"
  ON public.sth_memory FOR SELECT TO authenticated
  USING (
    public.has_admin_view(auth.uid())
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
    OR public.has_role(auth.uid(),'financeiro')
  );

CREATE POLICY "Staff can manage memory"
  ON public.sth_memory FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  );

-- 2) Timeline de eventos
CREATE TABLE public.sth_memory_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.sth_memory(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,           -- cadastro, dieta_enviada, atualizacao, dificuldade, treino_ajustado, mensagem, etc
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,                    -- user_id de quem registrou (NULL = automático)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sth_memory_timeline_memory_id ON public.sth_memory_timeline(memory_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_memory_timeline TO authenticated;
GRANT ALL ON public.sth_memory_timeline TO service_role;
ALTER TABLE public.sth_memory_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view timeline"
  ON public.sth_memory_timeline FOR SELECT TO authenticated
  USING (
    public.has_admin_view(auth.uid())
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
    OR public.has_role(auth.uid(),'financeiro')
  );

CREATE POLICY "Staff can write timeline"
  ON public.sth_memory_timeline FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  );

CREATE POLICY "Admins can edit timeline"
  ON public.sth_memory_timeline FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins can delete timeline"
  ON public.sth_memory_timeline FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 3) Objeções registradas
CREATE TABLE public.sth_memory_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.sth_memory(id) ON DELETE CASCADE,
  objection_key TEXT NOT NULL,        -- sem_tempo, dieta_dificil, treino_cansativo, ansiedade, plato
  raw_text TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sth_memory_objections_memory_id ON public.sth_memory_objections(memory_id);
CREATE INDEX idx_sth_memory_objections_key ON public.sth_memory_objections(objection_key);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_memory_objections TO authenticated;
GRANT ALL ON public.sth_memory_objections TO service_role;
ALTER TABLE public.sth_memory_objections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage objections"
  ON public.sth_memory_objections FOR ALL TO authenticated
  USING (
    public.has_admin_view(auth.uid())
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  );

-- 4) Aprendizado (Q/A/resultado)
CREATE TABLE public.sth_memory_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES public.sth_memory(id) ON DELETE CASCADE,
  phone TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  outcome TEXT,                       -- resolvido, nao_resolvido, convertido, renovou
  engine TEXT,                        -- local, gemini, ai
  intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sth_memory_learning_memory_id ON public.sth_memory_learning(memory_id, created_at DESC);
CREATE INDEX idx_sth_memory_learning_outcome ON public.sth_memory_learning(outcome);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_memory_learning TO authenticated;
GRANT ALL ON public.sth_memory_learning TO service_role;
ALTER TABLE public.sth_memory_learning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view learning"
  ON public.sth_memory_learning FOR SELECT TO authenticated
  USING (
    public.has_admin_view(auth.uid())
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  );

CREATE POLICY "Staff can update learning"
  ON public.sth_memory_learning FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  );

-- 5) Alertas
CREATE TABLE public.sth_memory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.sth_memory(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,           -- sem_atualizacao, sem_resposta, plano_vencendo, aluno_ausente, risco_desistencia
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sth_memory_alerts_memory_id ON public.sth_memory_alerts(memory_id);
CREATE INDEX idx_sth_memory_alerts_open ON public.sth_memory_alerts(acknowledged, severity);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_memory_alerts TO authenticated;
GRANT ALL ON public.sth_memory_alerts TO service_role;
ALTER TABLE public.sth_memory_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage alerts"
  ON public.sth_memory_alerts FOR ALL TO authenticated
  USING (
    public.has_admin_view(auth.uid())
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'consultor')
    OR public.has_role(auth.uid(),'assistente')
  );

-- Triggers de updated_at
CREATE TRIGGER trg_sth_memory_updated
BEFORE UPDATE ON public.sth_memory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função: upsert memória + registrar evento (usada pelo edge function)
CREATE OR REPLACE FUNCTION public.sth_memory_upsert(
  _phone TEXT,
  _patch JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
  v_id UUID;
BEGIN
  IF length(v_phone) < 8 THEN RAISE EXCEPTION 'invalid phone'; END IF;

  INSERT INTO public.sth_memory (phone, full_name, user_id, plan_name, plan_status, objective)
  VALUES (
    v_phone,
    NULLIF(_patch->>'full_name',''),
    NULLIF(_patch->>'user_id','')::uuid,
    NULLIF(_patch->>'plan_name',''),
    NULLIF(_patch->>'plan_status',''),
    NULLIF(_patch->>'objective','')
  )
  ON CONFLICT (phone) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.sth_memory.full_name),
    user_id = COALESCE(EXCLUDED.user_id, public.sth_memory.user_id),
    plan_name = COALESCE(EXCLUDED.plan_name, public.sth_memory.plan_name),
    plan_status = COALESCE(EXCLUDED.plan_status, public.sth_memory.plan_status),
    objective = COALESCE(EXCLUDED.objective, public.sth_memory.objective),
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Função: recalcular score (heurística simples)
CREATE OR REPLACE FUNCTION public.sth_memory_recalc_score(_memory_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.sth_memory;
  s INTEGER := 0;
  t TEXT := 'frio';
BEGIN
  SELECT * INTO m FROM public.sth_memory WHERE id = _memory_id;
  IF m.id IS NULL THEN RETURN 0; END IF;

  IF m.full_name IS NOT NULL THEN s := s + 10; END IF;
  IF m.objective IS NOT NULL THEN s := s + 10; END IF;
  IF m.plan_name IS NOT NULL THEN s := s + 15; END IF;
  IF m.lead_plan_presented IS NOT NULL THEN s := s + 15; END IF;
  IF m.last_interaction_at IS NOT NULL AND m.last_interaction_at > now() - interval '3 days' THEN s := s + 25; END IF;
  IF m.last_interaction_at IS NOT NULL AND m.last_interaction_at > now() - interval '24 hours' THEN s := s + 15; END IF;
  IF EXISTS (SELECT 1 FROM public.sth_memory_objections WHERE memory_id = m.id AND resolved) THEN s := s + 10; END IF;

  s := LEAST(100, GREATEST(0, s));

  IF s >= 81 THEN t := 'pronto';
  ELSIF s >= 51 THEN t := 'quente';
  ELSIF s >= 21 THEN t := 'morno';
  ELSE t := 'frio';
  END IF;

  UPDATE public.sth_memory SET score = s, temperature = t, updated_at = now() WHERE id = m.id;
  RETURN s;
END;
$$;

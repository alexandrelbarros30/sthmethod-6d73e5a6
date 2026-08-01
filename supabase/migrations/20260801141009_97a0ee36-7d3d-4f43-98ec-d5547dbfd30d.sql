-- ============ FASE 10: SAÚDE / WEARABLES ============
CREATE TABLE public.ai_app_health_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_health_sources TO authenticated;
GRANT ALL ON public.ai_app_health_sources TO service_role;
ALTER TABLE public.ai_app_health_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health sources own" ON public.ai_app_health_sources FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health sources admin read" ON public.ai_app_health_sources FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ai_app_health_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  steps INTEGER,
  active_kcal INTEGER,
  sleep_minutes INTEGER,
  resting_hr INTEGER,
  weight_kg NUMERIC(6,2),
  provider TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
CREATE INDEX idx_ai_health_days_user_day ON public.ai_app_health_days (user_id, day DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_health_days TO authenticated;
GRANT ALL ON public.ai_app_health_days TO service_role;
ALTER TABLE public.ai_app_health_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health days own" ON public.ai_app_health_days FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health days admin read" ON public.ai_app_health_days FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ FASE 11: MARKETPLACE DE COACHES ============
CREATE TABLE public.ai_app_coaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  price_month NUMERIC(10,2),
  city TEXT,
  avatar_url TEXT,
  contact_whatsapp TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.ai_app_coaches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_coaches TO authenticated;
GRANT ALL ON public.ai_app_coaches TO service_role;
ALTER TABLE public.ai_app_coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches public read" ON public.ai_app_coaches FOR SELECT
  USING (is_active AND is_approved);
CREATE POLICY "coaches owner manage" ON public.ai_app_coaches FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coaches admin manage" ON public.ai_app_coaches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ai_app_coach_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.ai_app_coaches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  goal TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_coach_requests_user ON public.ai_app_coach_requests (user_id, created_at DESC);
CREATE INDEX idx_ai_coach_requests_coach ON public.ai_app_coach_requests (coach_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_coach_requests TO authenticated;
GRANT ALL ON public.ai_app_coach_requests TO service_role;
ALTER TABLE public.ai_app_coach_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach requests student" ON public.ai_app_coach_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coach requests coach" ON public.ai_app_coach_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_app_coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_app_coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()));
CREATE POLICY "coach requests admin" ON public.ai_app_coach_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ai_app_coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.ai_app_coach_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_coach_messages_request ON public.ai_app_coach_messages (request_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_coach_messages TO authenticated;
GRANT ALL ON public.ai_app_coach_messages TO service_role;
ALTER TABLE public.ai_app_coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach messages participants" ON public.ai_app_coach_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_app_coach_requests r
    LEFT JOIN public.ai_app_coaches c ON c.id = r.coach_id
    WHERE r.id = request_id AND (r.user_id = auth.uid() OR c.user_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "coach messages send" ON public.ai_app_coach_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.ai_app_coach_requests r
    LEFT JOIN public.ai_app_coaches c ON c.id = r.coach_id
    WHERE r.id = request_id AND (r.user_id = auth.uid() OR c.user_id = auth.uid())
  ));

CREATE TRIGGER trg_ai_health_sources_updated BEFORE UPDATE ON public.ai_app_health_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_health_days_updated BEFORE UPDATE ON public.ai_app_health_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_coaches_updated BEFORE UPDATE ON public.ai_app_coaches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_coach_requests_updated BEFORE UPDATE ON public.ai_app_coach_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_coach_messages_updated BEFORE UPDATE ON public.ai_app_coach_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
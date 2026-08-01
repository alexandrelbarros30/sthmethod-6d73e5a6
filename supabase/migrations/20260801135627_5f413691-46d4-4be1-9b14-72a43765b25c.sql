CREATE TABLE IF NOT EXISTS public.ai_app_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'upgrade',
  plan text NOT NULL,
  discount_pct integer NOT NULL DEFAULT 0,
  reason text,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_app_offers_user_idx ON public.ai_app_offers(user_id, status);

GRANT SELECT, UPDATE ON public.ai_app_offers TO authenticated;
GRANT ALL ON public.ai_app_offers TO service_role;
ALTER TABLE public.ai_app_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_offers_select_own" ON public.ai_app_offers FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ai_offers_update_own" ON public.ai_app_offers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_app_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'prediction',
  content text NOT NULL DEFAULT '',
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  valid_until timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_app_insights_user_idx ON public.ai_app_insights(user_id, created_at DESC);

GRANT SELECT ON public.ai_app_insights TO authenticated;
GRANT ALL ON public.ai_app_insights TO service_role;
ALTER TABLE public.ai_app_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_insights_select_own" ON public.ai_app_insights FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ai_subs_admin_select" ON public.ai_app_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ai_profiles_admin_select" ON public.ai_app_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ai_checkins_admin_select" ON public.ai_app_checkins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ai_measurements_admin_select" ON public.ai_app_measurements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.ai_app_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  generation_id uuid REFERENCES public.ai_app_generations(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('diet','workout','analysis')),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  difficulty smallint CHECK (difficulty BETWEEN 1 AND 5),
  energy smallint CHECK (energy BETWEEN 1 AND 5),
  adherence_pct smallint CHECK (adherence_pct BETWEEN 0 AND 100),
  worked text[] NOT NULL DEFAULT '{}',
  blocked text[] NOT NULL DEFAULT '{}',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_feedback TO authenticated;
GRANT ALL ON public.ai_app_feedback TO service_role;

ALTER TABLE public.ai_app_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_feedback_own_all" ON public.ai_app_feedback
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_feedback_admin_read" ON public.ai_app_feedback
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ai_app_feedback_user_kind_idx ON public.ai_app_feedback (user_id, kind, created_at DESC);

CREATE TRIGGER ai_app_feedback_updated_at
  BEFORE UPDATE ON public.ai_app_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.food_ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid,
  admin_id uuid,
  source text NOT NULL DEFAULT 'admin', -- admin, portal, whatsapp
  mode text NOT NULL DEFAULT 'photo',    -- photo, label, text
  input_text text,
  input_image_meta jsonb,
  confidence numeric,
  quality_score numeric,
  classification text,
  foods jsonb NOT NULL DEFAULT '[]'::jsonb,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  ai_source text,
  reconciled_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'analyzed', -- analyzed, pending_review, saved, discarded, error
  needs_review boolean NOT NULL DEFAULT false,
  diary_entry_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  meal_type text,
  meal_label text,
  log_date date,
  error_code text,
  error_details text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_food_ai_logs_student ON public.food_ai_logs(student_id, created_at DESC);
CREATE INDEX idx_food_ai_logs_admin ON public.food_ai_logs(admin_id, created_at DESC);
CREATE INDEX idx_food_ai_logs_status ON public.food_ai_logs(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_ai_logs TO authenticated;
GRANT ALL ON public.food_ai_logs TO service_role;

ALTER TABLE public.food_ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage food_ai_logs" ON public.food_ai_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultors view linked food_ai_logs" ON public.food_ai_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND student_id IS NOT NULL AND is_consultant_of(auth.uid(), student_id));

CREATE POLICY "Students view own food_ai_logs" ON public.food_ai_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE OR REPLACE FUNCTION public.tg_food_ai_logs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_food_ai_logs_updated
BEFORE UPDATE ON public.food_ai_logs
FOR EACH ROW EXECUTE FUNCTION public.tg_food_ai_logs_updated_at();

-- Permitir administradores e consultores registrarem itens no diário do aluno
CREATE POLICY "Admins insert diary entries" ON public.food_diary_entries
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update diary entries" ON public.food_diary_entries
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete diary entries" ON public.food_diary_entries
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultors insert linked diary entries" ON public.food_diary_entries
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

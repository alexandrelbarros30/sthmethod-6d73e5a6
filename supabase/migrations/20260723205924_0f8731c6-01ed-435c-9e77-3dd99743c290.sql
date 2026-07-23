
CREATE TABLE public.student_clinical_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_by uuid,
  title text NOT NULL DEFAULT 'Análise STHIA',
  scope text NOT NULL DEFAULT 'full',
  brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  exam_input text,
  report_html text NOT NULL,
  summary text,
  red_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  markers jsonb NOT NULL DEFAULT '[]'::jsonb,
  visual_composition jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX student_clinical_analyses_user_idx ON public.student_clinical_analyses(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_clinical_analyses TO authenticated;
GRANT ALL ON public.student_clinical_analyses TO service_role;

ALTER TABLE public.student_clinical_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage clinical analyses"
  ON public.student_clinical_analyses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor'));

CREATE POLICY "Admin viewers can read clinical analyses"
  ON public.student_clinical_analyses FOR SELECT
  TO authenticated
  USING (public.has_admin_view(auth.uid()));

CREATE POLICY "Students read own clinical analyses"
  ON public.student_clinical_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_student_clinical_analyses_updated
  BEFORE UPDATE ON public.student_clinical_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

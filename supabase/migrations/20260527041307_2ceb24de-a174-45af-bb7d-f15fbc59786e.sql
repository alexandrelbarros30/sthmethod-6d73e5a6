CREATE TABLE public.student_content_batches (
  user_id uuid PRIMARY KEY,
  batch_started_at timestamptz,
  diet_ready_at timestamptz,
  training_ready_at timestamptz,
  protocol_ready_at timestamptz,
  combined_sent_at timestamptz,
  last_individual_sent jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_content_batches TO authenticated;
GRANT ALL ON public.student_content_batches TO service_role;

ALTER TABLE public.student_content_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage content batches"
ON public.student_content_batches
FOR ALL
TO authenticated
USING (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'assistente'))
WITH CHECK (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'assistente'));

CREATE TRIGGER trg_student_content_batches_updated_at
BEFORE UPDATE ON public.student_content_batches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
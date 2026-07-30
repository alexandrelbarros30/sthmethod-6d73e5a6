CREATE TABLE public.diet_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  created_by uuid,
  title text NOT NULL DEFAULT 'Orientação — consulta STHIA',
  advice_html text NOT NULL,
  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  cautions jsonb NOT NULL DEFAULT '[]'::jsonb,
  brief jsonb,
  protocol_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_diet_consultations_student ON public.diet_consultations(student_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_consultations TO authenticated;
GRANT ALL ON public.diet_consultations TO service_role;

ALTER TABLE public.diet_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view diet consultations"
ON public.diet_consultations FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_admin_view(auth.uid())
  OR public.is_consultant_of(auth.uid(), student_id)
);

CREATE POLICY "Staff can create diet consultations"
ON public.diet_consultations FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.is_consultant_of(auth.uid(), student_id)
  )
);

CREATE POLICY "Staff can update diet consultations"
ON public.diet_consultations FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_consultant_of(auth.uid(), student_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_consultant_of(auth.uid(), student_id)
);

CREATE POLICY "Staff can delete diet consultations"
ON public.diet_consultations FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_consultant_of(auth.uid(), student_id)
);

CREATE TRIGGER trg_diet_consultations_updated_at
BEFORE UPDATE ON public.diet_consultations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
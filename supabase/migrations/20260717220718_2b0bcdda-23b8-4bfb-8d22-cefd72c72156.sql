
-- ============================================================
-- Restringir escrita do consultor em bibliotecas globais
-- ============================================================

-- Garantir coluna created_by nas bibliotecas (se não existir)
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.diet_library     ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.protocol_library ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.training_programs ADD COLUMN IF NOT EXISTS created_by uuid;

-- ---------- training_programs ----------
DROP POLICY IF EXISTS "Consultors can manage own training programs" ON public.training_programs;
DROP POLICY IF EXISTS "Consultors can manage training programs"     ON public.training_programs;

CREATE POLICY "Consultors can view training programs"
  ON public.training_programs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role));

CREATE POLICY "Consultors can insert own training programs"
  ON public.training_programs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

CREATE POLICY "Consultors can update own training programs"
  ON public.training_programs FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

CREATE POLICY "Consultors can delete own training programs"
  ON public.training_programs FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

-- ---------- exercise_library ----------
-- SELECT policy já existe ("Consultors can view exercise library"). Não recriar.
DROP POLICY IF EXISTS "Consultors can manage exercise library" ON public.exercise_library;

CREATE POLICY "Consultors can insert own exercise library"
  ON public.exercise_library FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

CREATE POLICY "Consultors can update own exercise library"
  ON public.exercise_library FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

CREATE POLICY "Consultors can delete own exercise library"
  ON public.exercise_library FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

-- ---------- diet_library ----------
DROP POLICY IF EXISTS "Consultors can manage diet library" ON public.diet_library;

CREATE POLICY "Consultors can view diet library"
  ON public.diet_library FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role));

CREATE POLICY "Consultors can insert own diet library"
  ON public.diet_library FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

CREATE POLICY "Consultors can update own diet library"
  ON public.diet_library FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

CREATE POLICY "Consultors can delete own diet library"
  ON public.diet_library FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

-- ---------- protocol_library ----------
DROP POLICY IF EXISTS "Consultors can manage protocol library" ON public.protocol_library;

CREATE POLICY "Consultors can view protocol library"
  ON public.protocol_library FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role));

CREATE POLICY "Consultors can insert own protocol library"
  ON public.protocol_library FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

CREATE POLICY "Consultors can update own protocol library"
  ON public.protocol_library FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

CREATE POLICY "Consultors can delete own protocol library"
  ON public.protocol_library FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND created_by = auth.uid());

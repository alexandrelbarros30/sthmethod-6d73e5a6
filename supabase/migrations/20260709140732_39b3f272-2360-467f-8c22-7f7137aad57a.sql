-- Adiciona colunas de rastreio (troca/silenciar) nos dois modelos de atribuição de treino
ALTER TABLE public.student_workout_assignments
  ADD COLUMN IF NOT EXISTS replaced_at timestamptz,
  ADD COLUMN IF NOT EXISTS replaced_by uuid,
  ADD COLUMN IF NOT EXISTS replaced_reason text,
  ADD COLUMN IF NOT EXISTS alert_silenced_at timestamptz,
  ADD COLUMN IF NOT EXISTS alert_silenced_by uuid;

ALTER TABLE public.student_trainings
  ADD COLUMN IF NOT EXISTS replaced_at timestamptz,
  ADD COLUMN IF NOT EXISTS replaced_by uuid,
  ADD COLUMN IF NOT EXISTS replaced_reason text,
  ADD COLUMN IF NOT EXISTS alert_silenced_at timestamptz,
  ADD COLUMN IF NOT EXISTS alert_silenced_by uuid;

CREATE INDEX IF NOT EXISTS idx_swa_user_active_assigned
  ON public.student_workout_assignments (user_id, active, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_st_user_active_created
  ON public.student_trainings (user_id, is_active, created_at DESC);

-- Programa: vencimento e vídeo de apresentação (poster_url já existe)
ALTER TABLE public.training_programs
  ADD COLUMN IF NOT EXISTS expires_at date,
  ADD COLUMN IF NOT EXISTS video_url text DEFAULT '';

-- Exercícios do template: agrupamento (Biset/Triset/Drop-set)
ALTER TABLE public.workout_template_exercises
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS group_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS group_color text DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_wte_group_id
  ON public.workout_template_exercises(group_id);

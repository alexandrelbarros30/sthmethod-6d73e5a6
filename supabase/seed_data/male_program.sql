-- Inserir o Programa
WITH program_insert AS (
  INSERT INTO public.training_programs (name, description, gender, is_public)
  VALUES ('STH METHOD MASCULINO 1.0', 'Programa completo de hipertrofia com foco em expansão e volume máximo.', 'masculino', true)
  RETURNING id
),
-- Treino A
workout_a AS (
  INSERT INTO public.training_workouts (program_id, name, order_index)
  SELECT id, 'Treino A: Costas e Bíceps (Foco Expansão)', 1 FROM program_insert
  RETURNING id
),
-- Treino C
workout_c AS (
  INSERT INTO public.training_workouts (program_id, name, order_index)
  SELECT id, 'Treino C: Coxas e Panturrilhas Completas', 3 FROM program_insert
  RETURNING id
),
-- Treino D
workout_d AS (
  INSERT INTO public.training_workouts (program_id, name, order_index)
  SELECT id, 'Treino D: Costas (Espessura) e Choque de Braços', 4 FROM program_insert
  RETURNING id
)
-- Exercícios Treino A
INSERT INTO public.training_exercises (workout_id, exercise_id, sets, reps, notes, order_index)
SELECT workout_a.id, '2b5b143a-86c2-467e-b98b-1c85b72dd64e', 4, '10, 10, 8, 6', 'Foco expansão - carregando carga', 1 FROM workout_a
UNION ALL
SELECT workout_a.id, '33d74af2-d3a1-4afb-9046-7d1e625c1b44', 4, '10', 'Bi-set: Puxada Supinada + Pulldown na Polia alta', 2 FROM workout_a
UNION ALL
SELECT workout_a.id, 'f531753e-f9cd-4068-b441-2839ce71dbb4', 4, '10', 'Unilateral com drop-set na última série de cada braço', 3 FROM workout_a
UNION ALL
SELECT workout_a.id, '31faff75-5e66-430f-958c-a70a3ae35d7a', 3, '12', 'Isometria de 2 segundos no pico de contração', 4 FROM workout_a;

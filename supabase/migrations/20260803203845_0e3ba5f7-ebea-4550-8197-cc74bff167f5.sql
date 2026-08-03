-- 1. Forçar a limpeza e reinserção dos treinos com os dados corretos de vídeo
DELETE FROM public.workout_template_exercises WHERE template_id IN (SELECT id FROM public.workout_templates WHERE program_id = '1d50dd36-0a57-4fb5-b7f9-038f11312bf9');
DELETE FROM public.workout_templates WHERE program_id = '1d50dd36-0a57-4fb5-b7f9-038f11312bf9';

-- 2. Recriar os Templates (A, C, D)
INSERT INTO public.workout_templates (id, program_id, title, sort_order, released, created_by) VALUES
('a0000000-0000-0000-0000-000000000001', '1d50dd36-0a57-4fb5-b7f9-038f11312bf9', 'Treino A — Costas e Bíceps (Foco Expansão)', 1, true, 'd1398e8a-2707-4470-833d-186ea0e28c95'),
('c0000000-0000-0000-0000-000000000001', '1d50dd36-0a57-4fb5-b7f9-038f11312bf9', 'Treino C — Coxas e Panturrilhas (Foco Quadríceps)', 2, true, 'd1398e8a-2707-4470-833d-186ea0e28c95'),
('d0000000-0000-0000-0000-000000000001', '1d50dd36-0a57-4fb5-b7f9-038f11312bf9', 'Treino D — Costas (Espessura) e Choque de Braços', 3, true, 'd1398e8a-2707-4470-833d-186ea0e28c95');

-- 3. Inserir Exercícios do Treino A com VÍDEOS
INSERT INTO public.workout_template_exercises (template_id, exercise_id, custom_name, sets, reps, sort_order, video_url) VALUES
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Puxada Alta Neutra%' LIMIT 1), 'Puxada Alta Neutra (Polia)', '4', '10-12', 1, 'https://vimeo.com/914441584'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Remada Curvada com Barra%' LIMIT 1), 'Remada Curvada com Barra', '4', '8-10', 2, 'https://vimeo.com/914441113'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Puxada Alta%' AND name NOT ILIKE '%Neutra%' LIMIT 1), 'Puxada Alta Aberta', '3', '12', 3, 'https://vimeo.com/914441584'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Rosca Direta com Barra%' LIMIT 1), 'Rosca Direta com Barra', '4', '10', 4, 'https://vimeo.com/914441333'),
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Rosca Martelo%' LIMIT 1), 'Rosca Martelo com Halteres', '3', '12', 5, 'https://vimeo.com/914441333');

-- 4. Inserir Exercícios do Treino C com VÍDEOS
INSERT INTO public.workout_template_exercises (template_id, exercise_id, custom_name, sets, reps, sort_order, video_url) VALUES
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Agachamento%' LIMIT 1), 'Agachamento Livre com Barra', '4', '8-10', 1, 'https://vimeo.com/914441555'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Leg Press%' LIMIT 1), 'Leg Press 45', '4', '12', 2, 'https://vimeo.com/914441555'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Cadeira Extensora%' LIMIT 1), 'Cadeira Extensora', '3', '15 (Slow)', 3, 'https://vimeo.com/914441555'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Mesa Flexora%' LIMIT 1), 'Mesa Flexora', '4', '12', 4, 'https://vimeo.com/914441555'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Panturrilha em Pé%' LIMIT 1), 'Panturrilha em Pé', '4', '20', 5, 'https://vimeo.com/914441555');

-- 5. Inserir Exercícios do Treino D com VÍDEOS
INSERT INTO public.workout_template_exercises (template_id, exercise_id, custom_name, sets, reps, sort_order, video_url) VALUES
('d0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Remada Cavalinho%' OR name ILIKE '%Remada Curvada%' LIMIT 1), 'Remada Cavalinho', '4', '10', 1, 'https://vimeo.com/914441113'),
('d0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Supino%' LIMIT 1), 'Supino Reto com Barra', '4', '8-10', 2, 'https://vimeo.com/914441777'),
('d0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Rosca Scott%' LIMIT 1), 'Rosca Scott', '3', '10', 3, 'https://vimeo.com/914441333'),
('d0000000-0000-0000-0000-000000000001', (SELECT id FROM public.exercise_library WHERE name ILIKE '%Mergulho%' LIMIT 1), 'Mergulho em Paralelas', '3', 'Até a falha', 4, 'https://vimeo.com/914441777');

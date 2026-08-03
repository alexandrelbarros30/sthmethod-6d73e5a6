-- Atualização de vídeos do Treino A
UPDATE public.workout_template_exercises 
SET video_url = 'https://vimeo.com/914441584' 
WHERE template_id = 'a0000000-0000-0000-0000-000000000001' AND custom_name ILIKE '%Puxada Alta%';

UPDATE public.workout_template_exercises 
SET video_url = 'https://vimeo.com/914441113' 
WHERE template_id = 'a0000000-0000-0000-0000-000000000001' AND custom_name ILIKE '%Remada%';

UPDATE public.workout_template_exercises 
SET video_url = 'https://vimeo.com/914441333' 
WHERE template_id = 'a0000000-0000-0000-0000-000000000001' AND custom_name ILIKE '%Rosca%';

-- Atualização de vídeos do Treino C
UPDATE public.workout_template_exercises 
SET video_url = 'https://vimeo.com/914441555' 
WHERE template_id = 'c0000000-0000-0000-0000-000000000001' AND (custom_name ILIKE '%Agachamento%' OR custom_name ILIKE '%Leg Press%');

-- Atualização de vídeos do Treino D
UPDATE public.workout_template_exercises 
SET video_url = 'https://vimeo.com/914441777' 
WHERE template_id = 'd0000000-0000-0000-0000-000000000001' AND custom_name ILIKE '%Supino%';

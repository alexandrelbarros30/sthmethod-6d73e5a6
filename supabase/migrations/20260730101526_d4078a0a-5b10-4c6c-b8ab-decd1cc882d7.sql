
DO $$
DECLARE
  v_program uuid := '94c0bc90-cf93-402f-91e2-112f8a9801d3';
  v_creator uuid := 'd1398e8a-2707-4470-833d-186ea0e28c95';
  v_t uuid;
  g1 uuid := gen_random_uuid();
  g2 uuid := gen_random_uuid();
  g3 uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.workout_templates (title, subtitle, description, program_id, created_by, released, sort_order, days_per_week, minutes_per_day)
  VALUES (
    'Treino 4',
    'Pernas Completo + Abdominal',
    'Sessão com ênfase em anterior de coxa (quadríceps) e posterior de coxa, finalizando com core. Contém bisets e dropsets nas séries finais indicadas.',
    v_program, v_creator, true, 4, 4, 60
  ) RETURNING id INTO v_t;

  INSERT INTO public.workout_template_exercises
    (template_id, custom_name, custom_description, sets, reps, rest_interval, video_url, sort_order, group_id, group_name, group_color, supercoach_workout_id)
  VALUES
    (v_t, 'Cadeira Extensora', 'Aquecimento articular e pré-ativação do quadríceps. Cadência controlada, 2s na fase excêntrica e pausa de 1s no topo.', '3', '15', '45s', 'https://player.vimeo.com/video/465131428', 0, NULL, '', '', 9745329),
    (v_t, 'Agachamento Smith', 'Pés levemente à frente da barra, descida até 90º mantendo a coluna neutra. Foco em quadríceps.', '4', '10', '90s', 'https://player.vimeo.com/video/353551069', 1, NULL, '', '', 12222783),
    (v_t, 'Leg Press 45º - Pés em Baixo', 'Pés baixos na plataforma para maior recrutamento de quadríceps. DROPSET na última série: reduza 30% da carga e faça mais 10 repetições.', '4', '12 (última série dropset)', '90s', 'https://player.vimeo.com/video/465131993', 2, NULL, '', '', 11488491),
    (v_t, 'Cadeira Extensora - Unilateral', 'BISET A — 1º exercício. Uma perna por vez, sem pausa entre os lados.', '3', '12 cada perna', '0s (emenda)', 'https://player.vimeo.com/video/1104973233', 3, g1, 'Biset A', '#22c55e', 12237922),
    (v_t, 'Agachamento Búlgaro', 'BISET A — 2º exercício. Pé de trás apoiado no banco, tronco levemente inclinado. Descanse 90s ao final do biset.', '3', '10 cada perna', '90s', 'https://player.vimeo.com/video/259159333', 4, g1, 'Biset A', '#22c55e', 9748622),
    (v_t, 'Mesa Flexora', 'Ênfase em posterior de coxa. DROPSET na última série: reduza 30% da carga e faça mais 10 repetições.', '4', '12 (última série dropset)', '75s', 'https://player.vimeo.com/video/465132587', 5, NULL, '', '', 9415131),
    (v_t, 'Stiff com Barra', 'BISET B — 1º exercício. Joelhos semiflexionados, quadril para trás, sentir o alongamento do posterior.', '3', '12', '0s (emenda)', 'https://player.vimeo.com/video/465132939', 6, g2, 'Biset B', '#3b82f6', 10265569),
    (v_t, 'Cadeira Flexora', 'BISET B — 2º exercício. Contração máxima e retorno controlado. Descanse 90s ao final do biset.', '3', '15', '90s', 'https://player.vimeo.com/video/259167970', 7, g2, 'Biset B', '#3b82f6', 12190959),
    (v_t, 'Abdominal - Crunch Polia Alta', 'BISET C — 1º exercício. Flexão de coluna com foco na contração do reto abdominal.', '3', '15', '0s (emenda)', 'https://player.vimeo.com/video/272441920', 8, g3, 'Biset C', '#f59e0b', 10743056),
    (v_t, 'Elevação de Pernas Suspensa', 'BISET C — 2º exercício. Controle o balanço do corpo e eleve as pernas com o abdômen. Descanse 60s ao final do biset.', '3', '12', '60s', 'https://player.vimeo.com/video/460342845', 9, g3, 'Biset C', '#f59e0b', 10801907);
END $$;

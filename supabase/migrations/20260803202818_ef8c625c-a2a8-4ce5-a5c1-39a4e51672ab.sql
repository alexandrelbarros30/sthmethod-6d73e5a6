
DO $$
DECLARE
    prog_id uuid;
    week_id uuid;
    admin_id uuid;
BEGIN
    -- Obter o ID do admin
    SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
    
    IF admin_id IS NULL THEN
        admin_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Inserir o Programa
    INSERT INTO public.training_programs (title, details, objective, difficulty, status, created_by)
    VALUES ('STH METHOD MASCULINO 1.0', 'Programa completo de hipertrofia com foco em expansão e volume máximo.', 'Hipertrofia', 'Avançado', 'active', admin_id)
    RETURNING id INTO prog_id;

    -- Tentar encontrar a semana ativa existente ou criar uma inativa se necessário
    SELECT id INTO week_id FROM public.training_weeks WHERE user_id = admin_id AND is_active = true LIMIT 1;

    IF week_id IS NULL THEN
        INSERT INTO public.training_weeks (name, sort_order, user_id, is_active)
        VALUES ('Semana do Programa Masculino', 1, admin_id, false)
        RETURNING id INTO week_id;
    END IF;

    -- Treino A: Costas e Bíceps
    INSERT INTO public.training_exercises (week_id, name, sets, reps, notes, sort_order, video_url)
    VALUES 
    (week_id, 'Puxada Alta Pronada (Barra Longa)', '4', '10, 10, 8, 6', 'Carregando carga.', 1, 'https://vimeo.com/914441584'),
    (week_id, 'Puxada Supinada + Pulldown na Polia alta (Bi-set)', '4', '10', 'Executar em bi-set.', 2, 'https://vimeo.com/914441517'),
    (week_id, 'Remada Articulada Unilateral', '4', '10', 'Drop-set na última série de cada braço.', 3, 'https://vimeo.com/914443187'),
    (week_id, 'Remada Baixa com Triângulo', '3', '12', 'Isometria de 2 segundos no pico de contração.', 4, 'https://vimeo.com/914442654'),
    (week_id, 'Rosca Direta com Barra W', '4', '8-10', NULL, 5, 'https://vimeo.com/914445876'),
    (week_id, 'Rosca Alternada Inclinada + Rosca Martelo (Bi-set)', '4', '10', 'Executar em bi-set.', 6, 'https://vimeo.com/914446211'),
    (week_id, 'Rosca Inversa na Polia', '3', '15', 'Drop-set na última série.', 7, 'https://vimeo.com/914445432');

    -- Treino C: Coxas e Panturrilhas
    INSERT INTO public.training_exercises (week_id, name, sets, reps, notes, sort_order, video_url)
    VALUES 
    (week_id, 'Agachamento Livre com Barra', '4', '8-10', NULL, 8, 'https://vimeo.com/914438992'),
    (week_id, 'Leg Press 45º + Cadeira Extensora (Bi-set)', '4', '12', 'Executar em bi-set.', 9, 'https://vimeo.com/914439112'),
    (week_id, 'Agachamento Hack ou Avanço', '3', '10', NULL, 10, 'https://vimeo.com/914438776'),
    (week_id, 'Stiff com Halteres + Mesa Flexora (Bi-set)', '4', '10', 'Executar em bi-set.', 11, 'https://vimeo.com/914440211'),
    (week_id, 'Cadeira Flexora', '3', '12', 'Drop-set na última série.', 12, 'https://vimeo.com/914440554'),
    (week_id, 'Panturrilha em Pé + Panturrilha Sentado (Bi-set)', '4', '15-20', 'Executar em bi-set.', 13, 'https://vimeo.com/914441223');

    -- Treino D: Costas e Choque de Braços
    INSERT INTO public.training_exercises (week_id, name, sets, reps, notes, sort_order, video_url)
    VALUES 
    (week_id, 'Remada Curvada com Barra (Pronada)', '4', '8-10', NULL, 14, 'https://vimeo.com/914442887'),
    (week_id, 'Remada Cavalinho + Crucifixo Inverso (Bi-set)', '4', '10', 'Executar em bi-set.', 15, 'https://vimeo.com/914443445'),
    (week_id, 'Puxada Alta Triângulo', '3', '12', 'Drop-set na última série.', 16, 'https://vimeo.com/914441776'),
    (week_id, 'Rosca Scott W + Tríceps Supinado (Bi-set)', '4', '10', 'Bi-set de braços.', 17, 'https://vimeo.com/914446554'),
    (week_id, 'Rosca Concentrada + Tríceps Coice (Bi-set)', '3', '10', 'Unilateral.', 18, 'https://vimeo.com/914446889'),
    (week_id, 'Rosca Pajé ou Flexão de Punho', '3', 'Falha', 'Antebraço.', 19, 'https://vimeo.com/914447221');
END $$;

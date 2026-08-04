DO $$
DECLARE
    prog_id UUID;
    v_admin_id UUID;
    t_a UUID;
    t_b UUID;
    t_c UUID;
    t_d UUID;
    t_e UUID;
BEGIN
    -- Get an admin ID
    SELECT user_id INTO v_admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
    
    -- 1. Create Program
    INSERT INTO public.training_programs (title, details, objective, difficulty, status, created_by)
    VALUES (
        'STH METHOD MASCULINO 1.0', 
        'Programa completo de hipertrofia seguindo a Doutrina STHIA. Foco em progressão de carga e volume otimizado.',
        'hypertrophy',
        'intermediate',
        'published',
        v_admin_id
    ) RETURNING id INTO prog_id;

    -- 2. Create Workout Templates (A-E)
    
    -- TREINO A
    INSERT INTO public.workout_templates (program_id, title, subtitle, sort_order, created_by, released)
    VALUES (prog_id, 'Treino A', 'Peitoral e Abdômen', 1, v_admin_id, true) RETURNING id INTO t_a;
    
    -- TREINO B
    INSERT INTO public.workout_templates (program_id, title, subtitle, sort_order, created_by, released)
    VALUES (prog_id, 'Treino B', 'Costas, Ombro Posterior e Panturrilhas', 2, v_admin_id, true) RETURNING id INTO t_b;
    
    -- TREINO C
    INSERT INTO public.workout_templates (program_id, title, subtitle, sort_order, created_by, released)
    VALUES (prog_id, 'Treino C', 'Quadríceps e Glúteos', 3, v_admin_id, true) RETURNING id INTO t_c;
    
    -- TREINO D
    INSERT INTO public.workout_templates (program_id, title, subtitle, sort_order, created_by, released)
    VALUES (prog_id, 'Treino D', 'Deltoides e Trapézio', 4, v_admin_id, true) RETURNING id INTO t_d;
    
    -- TREINO E
    INSERT INTO public.workout_templates (program_id, title, subtitle, sort_order, created_by, released)
    VALUES (prog_id, 'Treino E', 'Bíceps, Tríceps e Posterior de Coxa', 5, v_admin_id, true) RETURNING id INTO t_e;
END $$;
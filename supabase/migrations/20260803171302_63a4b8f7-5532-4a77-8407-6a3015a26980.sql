CREATE TABLE IF NOT EXISTS public.app_contexts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL, -- 'sth_method', 'sth_ai'
    created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.app_contexts TO authenticated;
GRANT ALL ON public.app_contexts TO service_role;

INSERT INTO public.app_contexts (name) VALUES ('sth_method'), ('sth_ai') ON CONFLICT DO NOTHING;

-- Adiciona coluna de contexto às tabelas de dieta e diário
ALTER TABLE public.student_diets ADD COLUMN IF NOT EXISTS app_context text DEFAULT 'sth_method' REFERENCES public.app_contexts(name);
ALTER TABLE public.diet_meals ADD COLUMN IF NOT EXISTS app_context text DEFAULT 'sth_method' REFERENCES public.app_contexts(name);
ALTER TABLE public.food_diary_entries ADD COLUMN IF NOT EXISTS app_context text DEFAULT 'sth_method' REFERENCES public.app_contexts(name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_contexts TO authenticated;
GRANT ALL ON public.app_contexts TO service_role;

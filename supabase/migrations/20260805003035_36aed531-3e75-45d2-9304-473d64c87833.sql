-- Adiciona a coluna limitations na tabela ai_app_profiles se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'ai_app_profiles' 
                   AND column_name = 'limitations') THEN
        ALTER TABLE public.ai_app_profiles ADD COLUMN limitations text;
    END IF;
END $$;

GRANT ALL ON public.ai_app_profiles TO authenticated;
GRANT ALL ON public.ai_app_profiles TO service_role;
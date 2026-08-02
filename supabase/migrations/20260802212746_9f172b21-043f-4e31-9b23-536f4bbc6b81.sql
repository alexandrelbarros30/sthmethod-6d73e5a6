ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medications text;
ALTER TABLE public.ai_app_profiles ADD COLUMN IF NOT EXISTS comorbidities text;
ALTER TABLE public.ai_app_profiles ADD COLUMN IF NOT EXISTS medications text;
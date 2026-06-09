ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_id ON public.profiles (whatsapp_id);

-- Conceder acesso à service_role (já deve ter, mas para garantir)
GRANT ALL ON public.profiles TO service_role;

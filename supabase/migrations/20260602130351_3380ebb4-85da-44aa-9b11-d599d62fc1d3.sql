
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_opt_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_out_reason text;

CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_opt_out
  ON public.profiles(whatsapp_opt_out) WHERE whatsapp_opt_out = true;

-- Função utilitária: normaliza telefone e responde se há opt-out
CREATE OR REPLACE FUNCTION public.is_phone_opted_out(_phone text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE whatsapp_opt_out = true
      AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g')
          = regexp_replace(COALESCE(_phone, ''), '\D', '', 'g')
      AND length(regexp_replace(COALESCE(_phone, ''), '\D', '', 'g')) >= 10
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_phone_opted_out(text) TO anon, authenticated, service_role;

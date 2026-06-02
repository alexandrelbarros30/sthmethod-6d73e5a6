
-- Identificação do contato + janela de sessão de 2h no canal Comercial/Nutri
ALTER TABLE public.crm_conversations
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS identified_as text,  -- 'aluno_ativo' | 'aluno_vencido' | 'lead'
  ADD COLUMN IF NOT EXISTS session_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_crm_conv_user_id ON public.crm_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_conv_session_exp ON public.crm_conversations(session_expires_at);

-- Função utilitária: encerra conversas inativas há mais de 2h
CREATE OR REPLACE FUNCTION public.crm_expire_idle_conversations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.crm_conversations
     SET status = 'closed',
         session_started_at = NULL,
         session_expires_at = NULL
   WHERE status = 'open'
     AND session_expires_at IS NOT NULL
     AND session_expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Adicionar suporte para auditoria detalhada de envio de menus
ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS queue_type TEXT;
ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS flow_state TEXT;
ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS action_taken TEXT; -- 'sent', 'blocked', 'fallback', 'overwrite'

-- Criar tabela de locks para controle de concorrência por conversa se não existir (visto no código como crm_message_locks)
-- Mas o prompt mencionou lock por conversa/contato. O código já usa crm_message_locks.
-- Garantir que a tabela existe caso não tenha sido criada corretamente anteriormente.
CREATE TABLE IF NOT EXISTS public.crm_message_locks (
    phone TEXT PRIMARY KEY,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_message_locks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_message_locks TO authenticated;

-- Garantir permissões na automation_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_logs TO authenticated;

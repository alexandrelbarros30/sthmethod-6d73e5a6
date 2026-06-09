-- Adicionar hash de template e chave de idempotência para auditoria
ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS template_hash TEXT;
ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info'; -- 'info', 'warning', 'critical'

-- Índice para busca rápida de idempotência (contato + chave dentro de um curto período)
CREATE INDEX IF NOT EXISTS idx_automation_logs_idempotency ON public.automation_logs (contact_phone, idempotency_key, created_at);

-- Garantir que a tabela crm_message_locks suporte expiração rápida (já existe mas reforçando)
ALTER TABLE public.crm_message_locks ADD COLUMN IF NOT EXISTS context_key TEXT; -- Para locks específicos como 'menu_comercial'

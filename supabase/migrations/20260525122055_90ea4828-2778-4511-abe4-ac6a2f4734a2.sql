
ALTER TABLE public.ai_assistant_config
  ADD COLUMN IF NOT EXISTS fallback_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS fallback_message text DEFAULT 'Olá! Recebi sua mensagem. Em instantes um consultor humano irá te responder. Se preferir, acesse https://sthmethod.com.br';


ALTER TABLE public.ai_assistant_config
  ADD COLUMN IF NOT EXISTS business_hours jsonb NOT NULL DEFAULT '{
    "timezone": "America/Sao_Paulo",
    "mon": {"enabled": true, "open": "08:00", "close": "20:00"},
    "tue": {"enabled": true, "open": "08:00", "close": "20:00"},
    "wed": {"enabled": true, "open": "08:00", "close": "20:00"},
    "thu": {"enabled": true, "open": "08:00", "close": "20:00"},
    "fri": {"enabled": true, "open": "08:00", "close": "20:00"},
    "sat": {"enabled": true, "open": "09:00", "close": "14:00"},
    "sun": {"enabled": false, "open": "00:00", "close": "00:00"}
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS out_of_hours_message text NOT NULL DEFAULT 'Olá! Nosso atendimento automático está fora do horário. Retornamos no próximo expediente. Para urgências, fale com o Nutri Alexandre: https://wa.me/5521998984153',
  ADD COLUMN IF NOT EXISTS enforce_business_hours boolean NOT NULL DEFAULT false;

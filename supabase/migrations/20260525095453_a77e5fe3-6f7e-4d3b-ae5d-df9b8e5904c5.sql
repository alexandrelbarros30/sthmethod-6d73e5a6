
ALTER TABLE public.ai_assistant_config
  ADD COLUMN IF NOT EXISTS gemini_model text DEFAULT 'gemini-1.5-flash',
  ADD COLUMN IF NOT EXISTS gemini_fallback_model text DEFAULT 'gemini-1.5-flash-8b',
  ADD COLUMN IF NOT EXISTS gemini_temperature numeric DEFAULT 0.4,
  ADD COLUMN IF NOT EXISTS gemini_max_tokens integer DEFAULT 600,
  ADD COLUMN IF NOT EXISTS gemini_last_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS gemini_last_error text,
  ADD COLUMN IF NOT EXISTS gemini_last_used_at timestamptz;

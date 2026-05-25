ALTER TABLE public.ai_assistant_config 
ADD COLUMN IF NOT EXISTS local_prompt text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS assistant_name text NOT NULL DEFAULT 'STH One';
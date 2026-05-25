ALTER TABLE public.ai_assistant_config
ADD COLUMN IF NOT EXISTS engine text NOT NULL DEFAULT 'local';
CREATE TABLE IF NOT EXISTS public.ai_assistant_conversation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  intent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_conv_phone_time ON public.ai_assistant_conversation (phone, created_at DESC);
ALTER TABLE public.ai_assistant_conversation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read conversation" ON public.ai_assistant_conversation FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
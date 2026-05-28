ALTER TABLE public.api_channels
  ADD COLUMN IF NOT EXISTS reject_calls boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reject_call_message text NOT NULL DEFAULT 'Olá! 👋 Este número não recebe chamadas de áudio ou vídeo. Por favor, envie sua mensagem por aqui que retornamos o quanto antes. 🙏',
  ADD COLUMN IF NOT EXISTS calls_unlocked_until timestamptz NULL;

CREATE TABLE IF NOT EXISTS public.call_reject_throttle (
  phone text NOT NULL,
  channel_id uuid NOT NULL REFERENCES public.api_channels(id) ON DELETE CASCADE,
  last_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (phone, channel_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_reject_throttle TO authenticated;
GRANT ALL ON public.call_reject_throttle TO service_role;

ALTER TABLE public.call_reject_throttle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage call_reject_throttle"
  ON public.call_reject_throttle
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
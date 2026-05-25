
CREATE TABLE IF NOT EXISTS public.ai_assistant_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  reply text NOT NULL,
  priority int NOT NULL DEFAULT 100,
  enabled boolean NOT NULL DEFAULT true,
  hits int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.ai_assistant_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage training"
ON public.ai_assistant_training
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_training_updated
BEFORE UPDATE ON public.ai_assistant_training
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ai_training_enabled_priority
ON public.ai_assistant_training (enabled, priority);

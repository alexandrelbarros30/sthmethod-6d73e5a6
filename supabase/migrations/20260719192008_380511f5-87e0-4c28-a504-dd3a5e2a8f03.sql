
CREATE TABLE public.sthia_workout_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  mode TEXT NOT NULL DEFAULT 'generate',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sthia_conv_student ON public.sthia_workout_conversations(student_id, updated_at DESC);
CREATE INDEX idx_sthia_conv_creator ON public.sthia_workout_conversations(created_by, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sthia_workout_conversations TO authenticated;
GRANT ALL ON public.sthia_workout_conversations TO service_role;

ALTER TABLE public.sthia_workout_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all sthia conversations"
  ON public.sthia_workout_conversations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors manage their own sthia conversations"
  ON public.sthia_workout_conversations FOR ALL
  TO authenticated
  USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'consultor'))
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(), 'consultor'));

CREATE TRIGGER trg_sthia_conv_updated
  BEFORE UPDATE ON public.sthia_workout_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

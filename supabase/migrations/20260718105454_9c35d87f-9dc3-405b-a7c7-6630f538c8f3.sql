
-- Notificações do STH Flow (quando dieta/treino/protocolo são atribuídos)
CREATE TABLE IF NOT EXISTS public.student_flow_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('diet','protocol','training','flow_completed')),
  title text NOT NULL,
  message text,
  seen boolean NOT NULL DEFAULT false,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.student_flow_notifications TO authenticated;
GRANT ALL ON public.student_flow_notifications TO service_role;

ALTER TABLE public.student_flow_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own flow notifications"
  ON public.student_flow_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_view(auth.uid()) OR public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Students mark own flow notifications as seen"
  ON public.student_flow_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_student_flow_notifications_user_unseen
  ON public.student_flow_notifications (user_id, seen, created_at DESC);

-- Trigger genérico
CREATE OR REPLACE FUNCTION public.trg_student_flow_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_title text;
  v_msg text;
BEGIN
  IF TG_TABLE_NAME = 'student_diets' THEN
    v_kind := 'diet';
    v_title := 'Nova dieta disponível';
    v_msg := COALESCE(NEW.title, 'Sua dieta foi atualizada pelo time STH METHOD.');
  ELSIF TG_TABLE_NAME = 'student_protocols' THEN
    v_kind := 'protocol';
    v_title := 'Novo protocolo disponível';
    v_msg := COALESCE(NEW.title, 'Seu protocolo foi atualizado pelo time STH METHOD.');
  ELSIF TG_TABLE_NAME = 'student_workout_assignments' THEN
    v_kind := 'training';
    v_title := 'Novo treino atribuído';
    v_msg := 'Um novo programa de treino foi liberado para você.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.student_flow_notifications (user_id, kind, title, message)
  VALUES (NEW.user_id, v_kind, v_title, v_msg);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_flow_notify_diet ON public.student_diets;
CREATE TRIGGER trg_flow_notify_diet
  AFTER INSERT ON public.student_diets
  FOR EACH ROW EXECUTE FUNCTION public.trg_student_flow_notify();

DROP TRIGGER IF EXISTS trg_flow_notify_protocol ON public.student_protocols;
CREATE TRIGGER trg_flow_notify_protocol
  AFTER INSERT ON public.student_protocols
  FOR EACH ROW EXECUTE FUNCTION public.trg_student_flow_notify();

DROP TRIGGER IF EXISTS trg_flow_notify_training ON public.student_workout_assignments;
CREATE TRIGGER trg_flow_notify_training
  AFTER INSERT ON public.student_workout_assignments
  FOR EACH ROW EXECUTE FUNCTION public.trg_student_flow_notify();

-- Coluna para permitir aluno fechar o card quando 100% completo
ALTER TABLE public.student_flow_status
  ADD COLUMN IF NOT EXISTS completed_dismissed_at timestamptz;

-- Permitir aluno dar update no próprio status (apenas dismiss)
DROP POLICY IF EXISTS "Students dismiss own flow" ON public.student_flow_status;
CREATE POLICY "Students dismiss own flow"
  ON public.student_flow_status FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_flow_notifications;

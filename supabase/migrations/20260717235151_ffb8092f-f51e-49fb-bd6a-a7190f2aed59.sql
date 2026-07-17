
-- 1) Edit deadline columns
ALTER TABLE public.student_workout_sessions
  ADD COLUMN IF NOT EXISTS edit_deadline timestamptz NOT NULL DEFAULT (now() + interval '24 hours');

ALTER TABLE public.student_program_feedback
  ADD COLUMN IF NOT EXISTS edit_deadline timestamptz NOT NULL DEFAULT (now() + interval '24 hours');

-- 2) Audit table
CREATE TABLE IF NOT EXISTS public.student_feedback_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL,
  feedback_scope text NOT NULL CHECK (feedback_scope IN ('workout','program')),
  user_id uuid NOT NULL,
  changed_by uuid,
  before_data jsonb,
  after_data jsonb,
  changed_fields text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.student_feedback_audit TO authenticated;
GRANT ALL ON public.student_feedback_audit TO service_role;

ALTER TABLE public.student_feedback_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own feedback audit"
  ON public.student_feedback_audit FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all feedback audit"
  ON public.student_feedback_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultants view their students feedback audit"
  ON public.student_feedback_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE INDEX IF NOT EXISTS idx_sfa_feedback ON public.student_feedback_audit(feedback_scope, feedback_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sfa_user ON public.student_feedback_audit(user_id, created_at DESC);

-- 3) Audit trigger function (generic)
CREATE OR REPLACE FUNCTION public.log_student_feedback_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scope text;
  v_changed text[] := ARRAY[]::text[];
  v_before jsonb;
  v_after jsonb;
BEGIN
  IF TG_TABLE_NAME = 'student_workout_sessions' THEN
    v_scope := 'workout';
  ELSIF TG_TABLE_NAME = 'student_program_feedback' THEN
    v_scope := 'program';
  ELSE
    RETURN NEW;
  END IF;

  v_before := to_jsonb(OLD);
  v_after  := to_jsonb(NEW);

  SELECT array_agg(key) INTO v_changed
  FROM jsonb_each(v_after) a
  WHERE a.value IS DISTINCT FROM (v_before -> a.key)
    AND a.key NOT IN ('synced_to_stcoach','synced_at');

  IF v_changed IS NULL OR array_length(v_changed, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.student_feedback_audit(
    feedback_id, feedback_scope, user_id, changed_by, before_data, after_data, changed_fields
  ) VALUES (
    NEW.id, v_scope, NEW.user_id, auth.uid(), v_before, v_after, v_changed
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_workout_session_change ON public.student_workout_sessions;
CREATE TRIGGER trg_audit_workout_session_change
  AFTER UPDATE ON public.student_workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.log_student_feedback_change();

DROP TRIGGER IF EXISTS trg_audit_program_feedback_change ON public.student_program_feedback;
CREATE TRIGGER trg_audit_program_feedback_change
  AFTER UPDATE ON public.student_program_feedback
  FOR EACH ROW EXECUTE FUNCTION public.log_student_feedback_change();

-- 4) Update policies: allow student UPDATE only within deadline
DROP POLICY IF EXISTS "Students manage own program feedback" ON public.student_program_feedback;

CREATE POLICY "Students insert own program feedback"
  ON public.student_program_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students select own program feedback"
  ON public.student_program_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Students update own program feedback within deadline"
  ON public.student_program_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND now() <= edit_deadline)
  WITH CHECK (auth.uid() = user_id AND now() <= edit_deadline);

CREATE POLICY "Admins update all program feedback"
  ON public.student_program_feedback FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Workout sessions: add UPDATE policies (existing SELECT/INSERT stay)
CREATE POLICY "Students update own workout session within deadline"
  ON public.student_workout_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND now() <= edit_deadline)
  WITH CHECK (auth.uid() = user_id AND now() <= edit_deadline);

CREATE POLICY "Admins update all workout sessions"
  ON public.student_workout_sessions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

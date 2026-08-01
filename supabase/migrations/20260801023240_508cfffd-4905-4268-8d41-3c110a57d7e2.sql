CREATE TABLE public.coach_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.coach_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  goal text,
  weeks integer NOT NULL DEFAULT 4,
  cover_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coach_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.coach_tenants(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.coach_programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  day_label text,
  notes text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coach_workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.coach_tenants(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.coach_workouts(id) ON DELETE CASCADE,
  name text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  media_url text,
  thumb_url text,
  muscle_group text,
  sets integer NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '10',
  load_text text,
  rest_seconds integer NOT NULL DEFAULT 60,
  tempo text,
  group_type text NOT NULL DEFAULT 'single',
  group_key text,
  notes text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coach_student_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.coach_tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.coach_students(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.coach_programs(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, program_id)
);

CREATE INDEX idx_coach_workouts_program ON public.coach_workouts(program_id);
CREATE INDEX idx_coach_workout_ex_workout ON public.coach_workout_exercises(workout_id);
CREATE INDEX idx_coach_student_programs_student ON public.coach_student_programs(student_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_programs TO authenticated;
GRANT ALL ON public.coach_programs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_workouts TO authenticated;
GRANT ALL ON public.coach_workouts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_workout_exercises TO authenticated;
GRANT ALL ON public.coach_workout_exercises TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_student_programs TO authenticated;
GRANT ALL ON public.coach_student_programs TO service_role;

CREATE OR REPLACE FUNCTION public.coach_student_can_view_program(_program_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coach_student_programs sp
    JOIN public.coach_students s ON s.id = sp.student_id
    WHERE sp.program_id = _program_id
      AND sp.active = true
      AND s.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.coach_student_owns_record(_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_students s
    WHERE s.id = _student_id AND s.user_id = auth.uid()
  )
$$;

ALTER TABLE public.coach_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_student_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach members manage programs" ON public.coach_programs
FOR ALL TO authenticated
USING (public.coach_is_member(tenant_id))
WITH CHECK (public.coach_is_member(tenant_id));

CREATE POLICY "students view assigned programs" ON public.coach_programs
FOR SELECT TO authenticated
USING (public.coach_student_can_view_program(id));

CREATE POLICY "coach members manage workouts" ON public.coach_workouts
FOR ALL TO authenticated
USING (public.coach_is_member(tenant_id))
WITH CHECK (public.coach_is_member(tenant_id));

CREATE POLICY "students view assigned workouts" ON public.coach_workouts
FOR SELECT TO authenticated
USING (public.coach_student_can_view_program(program_id));

CREATE POLICY "coach members manage workout exercises" ON public.coach_workout_exercises
FOR ALL TO authenticated
USING (public.coach_is_member(tenant_id))
WITH CHECK (public.coach_is_member(tenant_id));

CREATE POLICY "students view assigned workout exercises" ON public.coach_workout_exercises
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.coach_workouts w
  WHERE w.id = coach_workout_exercises.workout_id
    AND public.coach_student_can_view_program(w.program_id)
));

CREATE POLICY "coach members manage assignments" ON public.coach_student_programs
FOR ALL TO authenticated
USING (public.coach_is_member(tenant_id))
WITH CHECK (public.coach_is_member(tenant_id));

CREATE POLICY "students view own assignments" ON public.coach_student_programs
FOR SELECT TO authenticated
USING (public.coach_student_owns_record(student_id));

CREATE TRIGGER coach_programs_updated_at BEFORE UPDATE ON public.coach_programs
FOR EACH ROW EXECUTE FUNCTION public.coach_touch_updated_at();
CREATE TRIGGER coach_workouts_updated_at BEFORE UPDATE ON public.coach_workouts
FOR EACH ROW EXECUTE FUNCTION public.coach_touch_updated_at();
CREATE TRIGGER coach_workout_exercises_updated_at BEFORE UPDATE ON public.coach_workout_exercises
FOR EACH ROW EXECUTE FUNCTION public.coach_touch_updated_at();
CREATE TRIGGER coach_student_programs_updated_at BEFORE UPDATE ON public.coach_student_programs
FOR EACH ROW EXECUTE FUNCTION public.coach_touch_updated_at();
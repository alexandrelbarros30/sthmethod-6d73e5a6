
-- Exercise Library (global catalog)
CREATE TABLE public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  muscle_group text DEFAULT '',
  video_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage exercise library" ON public.exercise_library FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Consultors can view exercise library" ON public.exercise_library FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "Students can view exercise library" ON public.exercise_library FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'student'));

-- Workout Templates
CREATE TABLE public.workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  weeks int DEFAULT 1,
  days_per_week int DEFAULT 3,
  minutes_per_day int DEFAULT 60,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workout templates" ON public.workout_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Consultors can manage own workout templates" ON public.workout_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'consultor')) WITH CHECK (public.has_role(auth.uid(), 'consultor'));

-- Workout Template Exercises (junction)
CREATE TABLE public.workout_template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES public.exercise_library(id) ON DELETE SET NULL,
  custom_name text DEFAULT '',
  custom_description text DEFAULT '',
  sets text DEFAULT '',
  reps text DEFAULT '',
  rest_interval text DEFAULT '',
  load_suggestion text DEFAULT '',
  video_url text DEFAULT '',
  sort_order int DEFAULT 0
);
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template exercises" ON public.workout_template_exercises FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Consultors can manage template exercises" ON public.workout_template_exercises FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'consultor')) WITH CHECK (public.has_role(auth.uid(), 'consultor'));

-- Student Workout Assignments
CREATE TABLE public.student_workout_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  active boolean DEFAULT true,
  UNIQUE(user_id, template_id)
);
ALTER TABLE public.student_workout_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignments" ON public.student_workout_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Consultors can manage linked assignments" ON public.student_workout_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));
CREATE POLICY "Students can view own assignments" ON public.student_workout_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Student Exercise Logs (load tracking)
CREATE TABLE public.student_exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assignment_id uuid NOT NULL REFERENCES public.student_workout_assignments(id) ON DELETE CASCADE,
  template_exercise_id uuid NOT NULL REFERENCES public.workout_template_exercises(id) ON DELETE CASCADE,
  load_used text DEFAULT '',
  notes text DEFAULT '',
  logged_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own logs" ON public.student_exercise_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all logs" ON public.student_exercise_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Consultors can view linked logs" ON public.student_exercise_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

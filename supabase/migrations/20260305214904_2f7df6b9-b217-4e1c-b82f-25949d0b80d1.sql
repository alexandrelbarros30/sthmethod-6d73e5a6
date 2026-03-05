
-- Create consultant_students linking table
CREATE TABLE public.consultant_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(consultant_id, student_id)
);

ALTER TABLE public.consultant_students ENABLE ROW LEVEL SECURITY;

-- Helper function: check if consultant owns a student
CREATE OR REPLACE FUNCTION public.is_consultant_of(_consultant_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultant_students
    WHERE consultant_id = _consultant_id AND student_id = _student_id
  )
$$;

-- RLS for consultant_students
CREATE POLICY "Admins can manage consultant_students"
  ON public.consultant_students FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultants can view own students"
  ON public.consultant_students FOR SELECT
  TO authenticated
  USING (auth.uid() = consultant_id);

CREATE POLICY "Assistentes can manage consultant_students"
  ON public.consultant_students FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'assistente'))
  WITH CHECK (public.has_role(auth.uid(), 'assistente'));

-- Consultors can view linked student profiles
CREATE POLICY "Consultors can view linked student profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

-- Assistente policies on profiles
CREATE POLICY "Assistentes can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'assistente'));

CREATE POLICY "Assistentes can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'assistente'));

CREATE POLICY "Assistentes can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'assistente'));

-- Financeiro policies
CREATE POLICY "Financeiro can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'financeiro'));

CREATE POLICY "Financeiro can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'financeiro'));

CREATE POLICY "Financeiro can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'financeiro'))
  WITH CHECK (public.has_role(auth.uid(), 'financeiro'));

CREATE POLICY "Financeiro can view subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'financeiro'));

CREATE POLICY "Financeiro can view plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'financeiro'));

-- Consultor policies on student data tables
CREATE POLICY "Consultors can manage linked student diets"
  ON public.student_diets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors can manage linked student trainings"
  ON public.student_trainings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors can manage linked student protocols"
  ON public.student_protocols FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors can manage linked diet meals"
  ON public.diet_meals FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors can manage linked training weeks"
  ON public.training_weeks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors can manage linked protocols"
  ON public.protocols FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
  WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors can view linked subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

-- Assistente policies on user_roles
CREATE POLICY "Assistentes can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'assistente'));

CREATE POLICY "Assistentes can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'assistente'))
  WITH CHECK (public.has_role(auth.uid(), 'assistente'));

-- Assistente can view subscriptions
CREATE POLICY "Assistentes can view subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'assistente'));

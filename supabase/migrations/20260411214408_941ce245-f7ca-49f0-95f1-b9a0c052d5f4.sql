
-- Table for 29-day evolution update reminders
CREATE TABLE public.evolution_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  student_name text NOT NULL DEFAULT '',
  subscription_id uuid NOT NULL,
  cycle_number integer NOT NULL DEFAULT 1,
  due_date date NOT NULL,
  seen boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint to avoid duplicate reminders
ALTER TABLE public.evolution_reminders
  ADD CONSTRAINT unique_sub_cycle UNIQUE (subscription_id, cycle_number);

ALTER TABLE public.evolution_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage evolution_reminders"
  ON public.evolution_reminders FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultors can view linked evolution_reminders"
  ON public.evolution_reminders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), student_user_id));

CREATE POLICY "Financeiro can view evolution_reminders"
  ON public.evolution_reminders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'financeiro'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.evolution_reminders;

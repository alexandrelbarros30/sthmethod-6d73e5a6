CREATE TABLE public.protocol_phase_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phase_key text NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, phase_key, checkin_date)
);

CREATE INDEX idx_pphc_user_date ON public.protocol_phase_checkins (user_id, checkin_date);

ALTER TABLE public.protocol_phase_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own phase checkins"
  ON public.protocol_phase_checkins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all phase checkins"
  ON public.protocol_phase_checkins
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultors view linked phase checkins"
  ON public.protocol_phase_checkins
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood SMALLINT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy SMALLINT NOT NULL CHECK (energy BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_checkins TO authenticated;
GRANT ALL ON public.daily_checkins TO service_role;

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checkins"
  ON public.daily_checkins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all checkins"
  ON public.daily_checkins FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultants view their students checkins"
  ON public.daily_checkins FOR SELECT
  USING (public.is_consultant_of(auth.uid(), user_id));

CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins (user_id, checkin_date DESC);

CREATE TRIGGER trg_daily_checkins_updated
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

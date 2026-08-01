CREATE TABLE public.ai_app_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  diet_done boolean NOT NULL DEFAULT false,
  workout_done boolean NOT NULL DEFAULT false,
  water_done boolean NOT NULL DEFAULT false,
  mood smallint,
  energy smallint,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_app_checkins TO authenticated;
GRANT ALL ON public.ai_app_checkins TO service_role;

ALTER TABLE public.ai_app_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ai checkins" ON public.ai_app_checkins FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "staff read ai checkins" ON public.ai_app_checkins FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultor'::app_role));

CREATE INDEX ai_app_checkins_user_idx ON public.ai_app_checkins (user_id, checkin_date DESC);

CREATE TRIGGER ai_app_checkins_updated_at BEFORE UPDATE ON public.ai_app_checkins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
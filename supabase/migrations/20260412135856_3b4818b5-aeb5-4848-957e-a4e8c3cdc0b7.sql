
-- Table for evolution update notifications
CREATE TABLE public.evolution_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  new_weight NUMERIC,
  previous_weight NUMERIC,
  has_photos BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evolution_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage evolution_notifications"
ON public.evolution_notifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can view linked evolution_notifications"
ON public.evolution_notifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), student_user_id));

CREATE POLICY "Financeiro can view evolution_notifications"
ON public.evolution_notifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'financeiro'));

-- Trigger function: auto-create notification on weight_logs insert
CREATE OR REPLACE FUNCTION public.notify_evolution_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name TEXT;
  v_prev_weight NUMERIC;
BEGIN
  SELECT full_name INTO v_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  
  SELECT weight INTO v_prev_weight FROM public.weight_logs
  WHERE user_id = NEW.user_id AND id != NEW.id
  ORDER BY logged_at DESC LIMIT 1;

  INSERT INTO public.evolution_notifications (student_user_id, student_name, new_weight, previous_weight)
  VALUES (NEW.user_id, COALESCE(v_name, 'Aluno'), NEW.weight, v_prev_weight);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_weight_log_insert
AFTER INSERT ON public.weight_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_evolution_update();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.evolution_notifications;


-- Admin reminders table for diet adjustments and renewal tracking
CREATE TABLE public.admin_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'diet_adjustment', -- 'diet_adjustment' or 'renewal'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'done', 'postponed', 'disabled'
  due_date DATE NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reminders"
ON public.admin_reminders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_admin_reminders_updated_at
BEFORE UPDATE ON public.admin_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

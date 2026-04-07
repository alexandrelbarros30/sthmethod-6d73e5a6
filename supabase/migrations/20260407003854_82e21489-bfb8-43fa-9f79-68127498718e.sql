
-- Custom popups table
CREATE TABLE public.custom_popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  button_text TEXT DEFAULT '',
  button_route TEXT DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  target_type TEXT NOT NULL DEFAULT 'all_active',
  target_user_id UUID,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom popups"
ON public.custom_popups FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view active popups"
ON public.custom_popups FOR SELECT TO authenticated
USING (active = true);

-- Popup dismissals table
CREATE TABLE public.popup_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  popup_id UUID NOT NULL REFERENCES public.custom_popups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(popup_id, user_id)
);

ALTER TABLE public.popup_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own dismissals"
ON public.popup_dismissals FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own dismissals"
ON public.popup_dismissals FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all dismissals"
ON public.popup_dismissals FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_custom_popups_updated_at
BEFORE UPDATE ON public.custom_popups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Create anamnesis_entries table for historical anamnesis records
CREATE TABLE public.anamnesis_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.anamnesis_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage anamnesis"
ON public.anamnesis_entries
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own anamnesis"
ON public.anamnesis_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_anamnesis_entries_updated_at
BEFORE UPDATE ON public.anamnesis_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

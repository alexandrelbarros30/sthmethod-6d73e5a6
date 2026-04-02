
CREATE TABLE public.free_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  age INTEGER,
  weight NUMERIC,
  height NUMERIC,
  objective TEXT DEFAULT '',
  frequency INTEGER,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.free_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (no auth required for free leads)
CREATE POLICY "Anyone can insert free leads"
  ON public.free_leads FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can view leads
CREATE POLICY "Admins can view free leads"
  ON public.free_leads FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can update leads
CREATE POLICY "Admins can update free leads"
  ON public.free_leads FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.lab_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  biological_sex text NOT NULL,
  usage_status text NOT NULL,
  usage_duration text,
  compounds text[],
  weekly_dose text,
  uses_oral_17aa boolean DEFAULT false,
  uses_testosterone boolean DEFAULT false,
  uses_aggressive boolean DEFAULT false,
  uses_gh_insulin boolean DEFAULT false,
  uses_ai_caber boolean DEFAULT false,
  has_medical_followup boolean DEFAULT false,
  age integer,
  weight_kg numeric,
  height_cm numeric,
  body_fat_pct numeric,
  blood_pressure text,
  risk_history text[],
  symptoms text[],
  notes text,
  markers jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  contacted boolean NOT NULL DEFAULT false
);

ALTER TABLE public.lab_screenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert lab screenings"
  ON public.lab_screenings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view lab screenings"
  ON public.lab_screenings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lab screenings"
  ON public.lab_screenings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lab screenings"
  ON public.lab_screenings FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_lab_screenings_created_at ON public.lab_screenings (created_at DESC);
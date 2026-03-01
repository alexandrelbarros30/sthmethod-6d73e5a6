
-- Add subtitle to plans
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS subtitle text NOT NULL DEFAULT '';

-- Create student_diets table (one per student, managed by admin)
CREATE TABLE public.student_diets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Dieta',
  pdf_url text DEFAULT '',
  content text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_diets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage diets" ON public.student_diets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own diet" ON public.student_diets FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_student_diets_updated_at BEFORE UPDATE ON public.student_diets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create student_protocols table
CREATE TABLE public.student_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Protocolo',
  pdf_url text DEFAULT '',
  content text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage student protocols" ON public.student_protocols FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own student protocol" ON public.student_protocols FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_student_protocols_updated_at BEFORE UPDATE ON public.student_protocols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create student_trainings table
CREATE TABLE public.student_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Treino',
  pdf_url text DEFAULT '',
  content text DEFAULT '',
  video_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage student trainings" ON public.student_trainings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own student training" ON public.student_trainings FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER update_student_trainings_updated_at BEFORE UPDATE ON public.student_trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for document PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "Admins can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');

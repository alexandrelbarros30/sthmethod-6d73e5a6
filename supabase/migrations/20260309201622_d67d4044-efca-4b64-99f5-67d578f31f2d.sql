
-- Table for clinical document history (exams and prescriptions)
CREATE TABLE public.clinical_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'lab_exam' or 'medical_prescription'
  file_url text NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins full access clinical_documents"
  ON public.clinical_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Students can insert own documents
CREATE POLICY "Students insert own clinical_documents"
  ON public.clinical_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Students can view own documents
CREATE POLICY "Students select own clinical_documents"
  ON public.clinical_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Consultors can view linked student documents
CREATE POLICY "Consultors view linked clinical_documents"
  ON public.clinical_documents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

-- Assistentes can view clinical documents
CREATE POLICY "Assistentes view clinical_documents"
  ON public.clinical_documents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'assistente'));

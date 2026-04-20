ALTER TABLE public.body_images ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.clinical_documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.student_diets ADD COLUMN IF NOT EXISTS storage_path TEXT;
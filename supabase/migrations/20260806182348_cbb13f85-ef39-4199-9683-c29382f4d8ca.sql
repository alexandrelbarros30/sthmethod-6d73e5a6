ALTER TABLE public.student_clinical_analyses 
ADD COLUMN IF NOT EXISTS visibility_settings JSONB DEFAULT '{
  "lab_interpretation": true,
  "general_summary": true,
  "visual_composition": true,
  "body_composition": true,
  "red_flags": true,
  "prioritized_recommendations": true
}'::jsonb;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_clinical_analyses TO authenticated;
GRANT ALL ON public.student_clinical_analyses TO service_role;

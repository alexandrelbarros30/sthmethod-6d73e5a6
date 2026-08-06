ALTER TABLE public.student_clinical_analyses 
ADD COLUMN IF NOT EXISTS visibility_settings JSONB DEFAULT '{
  "lab_interpretation": true,
  "general_summary": true,
  "visual_composition": true,
  "body_composition": true,
  "red_flags": true,
  "prioritized_recommendations": true
}'::jsonb;

COMMENT ON COLUMN public.student_clinical_analyses.visibility_settings IS 'Controls visibility of specific topics for the student.';

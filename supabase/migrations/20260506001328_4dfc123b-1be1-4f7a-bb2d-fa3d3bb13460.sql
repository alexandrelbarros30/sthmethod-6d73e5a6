-- Add image to workout templates
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';

-- Public bucket for workout card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('workout-images', 'workout-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Workout images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'workout-images');

-- Admin/consultor can upload/update/delete
CREATE POLICY "Staff can upload workout images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'workout-images' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'consultor'::app_role)));

CREATE POLICY "Staff can update workout images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'workout-images' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'consultor'::app_role)));

CREATE POLICY "Staff can delete workout images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'workout-images' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'consultor'::app_role)));

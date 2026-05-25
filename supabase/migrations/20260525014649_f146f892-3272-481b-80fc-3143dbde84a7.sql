
ALTER TABLE public.ai_assistant_training
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-training-media', 'ai-training-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read ai-training-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-training-media');

CREATE POLICY "Admins upload ai-training-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-training-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update ai-training-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ai-training-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete ai-training-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ai-training-media' AND public.has_role(auth.uid(), 'admin'));

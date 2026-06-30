CREATE POLICY "Admin viewers can read body-images bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'body-images'
  AND public.has_admin_view(auth.uid())
);
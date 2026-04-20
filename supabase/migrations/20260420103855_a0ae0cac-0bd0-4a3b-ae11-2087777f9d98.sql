-- Make buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('body-images', 'documents');

-- Drop any pre-existing storage policies on these buckets to start clean
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN (
        'body_images_select_own','body_images_insert_own','body_images_update_own','body_images_delete_own',
        'body_images_admin_all','body_images_consultor_select','body_images_consultor_insert',
        'documents_select_own','documents_insert_own','documents_update_own','documents_delete_own',
        'documents_admin_all','documents_assistente_select','documents_consultor_select','documents_consultor_insert'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- ===== body-images =====
CREATE POLICY "body_images_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'body-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "body_images_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'body-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "body_images_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'body-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "body_images_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'body-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "body_images_admin_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'body-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'body-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "body_images_consultor_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'body-images'
  AND public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND public.is_consultant_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "body_images_consultor_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'body-images'
  AND public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND public.is_consultant_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- ===== documents =====
CREATE POLICY "documents_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "documents_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "documents_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "documents_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "documents_admin_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "documents_assistente_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND public.has_role(auth.uid(), 'assistente'::public.app_role)
);

CREATE POLICY "documents_consultor_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND public.is_consultant_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "documents_consultor_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND public.is_consultant_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
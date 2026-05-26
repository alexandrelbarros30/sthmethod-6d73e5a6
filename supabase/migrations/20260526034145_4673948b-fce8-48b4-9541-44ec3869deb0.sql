
-- body-images: remove public-read policy (scoped policies cover legitimate access)
DROP POLICY IF EXISTS "Public view body images" ON storage.objects;

-- documents: remove broad authenticated-read policy
DROP POLICY IF EXISTS "Authenticated can view documents" ON storage.objects;

-- billing-attachments: restrict writes to staff roles
DROP POLICY IF EXISTS "Authenticated can upload billing attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update billing attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete billing attachments" ON storage.objects;

CREATE POLICY "Staff can upload billing attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'billing-attachments'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'financeiro'::app_role)
    OR has_role(auth.uid(), 'assistente'::app_role)
  )
);

CREATE POLICY "Staff can update billing attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'billing-attachments'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'financeiro'::app_role)
    OR has_role(auth.uid(), 'assistente'::app_role)
  )
);

CREATE POLICY "Staff can delete billing attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'billing-attachments'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'financeiro'::app_role)
    OR has_role(auth.uid(), 'assistente'::app_role)
  )
);

-- ads bucket: restrict uploads to admins
DROP POLICY IF EXISTS "Auth upload ads" ON storage.objects;
CREATE POLICY "Admins upload ads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ads'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- custom_popups: scope target_user_id targeted popups
DROP POLICY IF EXISTS "Students can view active popups" ON public.custom_popups;
CREATE POLICY "Users view targeted active popups"
ON public.custom_popups FOR SELECT TO authenticated
USING (
  active = true
  AND (
    target_type IS NULL
    OR target_type = 'all_active'
    OR target_user_id IS NULL
    OR target_user_id = auth.uid()
  )
);

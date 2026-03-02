
-- Drop all existing restrictive policies on body_images
DROP POLICY IF EXISTS "Admins can manage body images" ON public.body_images;
DROP POLICY IF EXISTS "Users can view own body images" ON public.body_images;
DROP POLICY IF EXISTS "Users can insert own body images" ON public.body_images;
DROP POLICY IF EXISTS "Users can update own body images" ON public.body_images;
DROP POLICY IF EXISTS "Users can delete own body images" ON public.body_images;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Admins full access body images"
ON public.body_images FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students select own body images"
ON public.body_images FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students insert own body images"
ON public.body_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students update own body images"
ON public.body_images FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Students delete own body images"
ON public.body_images FOR DELETE
USING (auth.uid() = user_id);

-- Also fix storage policies for body-images bucket
DROP POLICY IF EXISTS "Users can upload body images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view body images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view body images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload body images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users view body images" ON storage.objects;

CREATE POLICY "Authenticated upload body images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'body-images');

CREATE POLICY "Authenticated update body images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'body-images');

CREATE POLICY "Public view body images"
ON storage.objects FOR SELECT
USING (bucket_id = 'body-images');


-- Drop existing RESTRICTIVE policies on body_images
DROP POLICY IF EXISTS "Admins full access body images" ON public.body_images;
DROP POLICY IF EXISTS "Students delete own body images" ON public.body_images;
DROP POLICY IF EXISTS "Students insert own body images" ON public.body_images;
DROP POLICY IF EXISTS "Students select own body images" ON public.body_images;
DROP POLICY IF EXISTS "Students update own body images" ON public.body_images;

-- Re-create as PERMISSIVE policies
CREATE POLICY "Admins full access body images"
ON public.body_images FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students select own body images"
ON public.body_images FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students insert own body images"
ON public.body_images FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students update own body images"
ON public.body_images FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students delete own body images"
ON public.body_images FOR DELETE TO authenticated
USING (auth.uid() = user_id);

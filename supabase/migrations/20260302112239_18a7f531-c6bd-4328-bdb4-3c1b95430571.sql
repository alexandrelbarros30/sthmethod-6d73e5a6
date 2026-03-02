
-- Drop restrictive policies
DROP POLICY IF EXISTS "Admins can manage body images" ON public.body_images;
DROP POLICY IF EXISTS "Users can insert own body images" ON public.body_images;
DROP POLICY IF EXISTS "Users can update own body images" ON public.body_images;
DROP POLICY IF EXISTS "Users can view own body images" ON public.body_images;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can manage body images"
ON public.body_images FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own body images"
ON public.body_images FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body images"
ON public.body_images FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body images"
ON public.body_images FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body images"
ON public.body_images FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

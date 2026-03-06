CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
TO anon
USING (active = true);
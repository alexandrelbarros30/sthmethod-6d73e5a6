
ALTER TABLE public.metabolic_panels ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';

CREATE POLICY "Admins can delete metabolic panels"
ON public.metabolic_panels
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

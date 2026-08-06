GRANT SELECT ON public.student_clinical_analyses TO authenticated;
GRANT ALL ON public.student_clinical_analyses TO service_role;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_clinical_analyses' 
        AND policyname = 'Admins can view all clinical analyses'
    ) THEN
        CREATE POLICY "Admins can view all clinical analyses" 
        ON public.student_clinical_analyses 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;
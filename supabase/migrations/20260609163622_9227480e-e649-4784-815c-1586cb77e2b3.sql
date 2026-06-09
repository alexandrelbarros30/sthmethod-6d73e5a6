CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_phone TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'blocked_duplicate', 'blocked_human_active', 'student_recognized', 'automation_triggered'
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.automation_logs TO authenticated;
GRANT ALL ON public.automation_logs TO service_role;

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to automation_logs" ON public.automation_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read access to automation_logs" ON public.automation_logs
    FOR SELECT TO authenticated USING (true);

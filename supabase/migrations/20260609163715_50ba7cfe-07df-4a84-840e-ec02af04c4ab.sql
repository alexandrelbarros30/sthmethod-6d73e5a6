CREATE TABLE IF NOT EXISTS public.crm_message_locks (
    phone TEXT PRIMARY KEY,
    locked_at TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON public.crm_message_locks TO service_role;
ALTER TABLE public.crm_message_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage locks" ON public.crm_message_locks FOR ALL TO service_role USING (true);

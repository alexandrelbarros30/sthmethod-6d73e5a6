
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL DEFAULT gen_random_uuid()::text,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  logged_out_at timestamptz,
  duration_seconds integer,
  page_path text DEFAULT '/',
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs"
ON public.access_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert own access logs"
ON public.access_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own access logs"
ON public.access_logs FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anon can insert free access logs"
ON public.access_logs FOR INSERT TO anon
WITH CHECK (is_free = true);

CREATE POLICY "Anon can update free access logs"
ON public.access_logs FOR UPDATE TO anon
USING (is_free = true AND user_id IS NULL);

CREATE INDEX idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX idx_access_logs_logged_in_at ON public.access_logs(logged_in_at);

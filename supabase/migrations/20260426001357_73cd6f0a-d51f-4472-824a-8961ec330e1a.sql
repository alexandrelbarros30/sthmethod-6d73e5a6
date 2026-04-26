CREATE TABLE public.service_queue_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  dismissed_by UUID NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, type, occurred_at)
);

ALTER TABLE public.service_queue_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage service queue dismissals"
ON public.service_queue_dismissals
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultors view service queue dismissals"
ON public.service_queue_dismissals
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'consultor'::app_role));

CREATE POLICY "Consultors insert service queue dismissals"
ON public.service_queue_dismissals
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND dismissed_by = auth.uid());

CREATE INDEX idx_sqd_lookup ON public.service_queue_dismissals (user_id, type);
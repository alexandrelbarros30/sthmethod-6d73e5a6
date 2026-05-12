
-- Table
CREATE TABLE public.protocol_continuity_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid NOT NULL UNIQUE,
  previous_subscription_id uuid,
  gap_days integer NOT NULL DEFAULT 0,
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('auto_continue','continue','restart','pending')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pcd_user ON public.protocol_continuity_decisions(user_id);
CREATE INDEX idx_pcd_subscription ON public.protocol_continuity_decisions(subscription_id);

ALTER TABLE public.protocol_continuity_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own continuity decisions"
ON public.protocol_continuity_decisions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage continuity decisions"
ON public.protocol_continuity_decisions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultors manage linked continuity decisions"
ON public.protocol_continuity_decisions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id))
WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

CREATE TRIGGER update_pcd_updated_at
BEFORE UPDATE ON public.protocol_continuity_decisions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger function: auto-create decision on new subscription
CREATE OR REPLACE FUNCTION public.create_protocol_continuity_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev RECORD;
  v_gap integer;
  v_decision text;
BEGIN
  SELECT id, end_date INTO v_prev
  FROM public.subscriptions
  WHERE user_id = NEW.user_id AND id <> NEW.id
  ORDER BY end_date DESC
  LIMIT 1;

  IF v_prev.id IS NULL THEN
    RETURN NEW;
  END IF;

  v_gap := GREATEST(0, (NEW.start_date - v_prev.end_date));

  IF v_gap <= 15 THEN
    v_decision := 'auto_continue';
  ELSE
    v_decision := 'pending';
  END IF;

  INSERT INTO public.protocol_continuity_decisions (
    user_id, subscription_id, previous_subscription_id, gap_days, decision
  ) VALUES (
    NEW.user_id, NEW.id, v_prev.id, v_gap, v_decision
  )
  ON CONFLICT (subscription_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscription_continuity
AFTER INSERT ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.create_protocol_continuity_decision();

-- Backfill existing subscriptions
INSERT INTO public.protocol_continuity_decisions (user_id, subscription_id, previous_subscription_id, gap_days, decision, decided_at)
SELECT
  s.user_id,
  s.id,
  prev.id,
  GREATEST(0, (s.start_date - prev.end_date)),
  CASE WHEN GREATEST(0, (s.start_date - prev.end_date)) <= 15 THEN 'auto_continue' ELSE 'pending' END,
  CASE WHEN GREATEST(0, (s.start_date - prev.end_date)) <= 15 THEN now() ELSE NULL END
FROM public.subscriptions s
JOIN LATERAL (
  SELECT id, end_date FROM public.subscriptions s2
  WHERE s2.user_id = s.user_id AND s2.id <> s.id AND s2.created_at < s.created_at
  ORDER BY s2.end_date DESC
  LIMIT 1
) prev ON TRUE
ON CONFLICT (subscription_id) DO NOTHING;

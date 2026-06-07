-- Atualiza a função de decisão de continuidade para ser automática independente do GAP
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

  -- Agora sempre auto_continue para automação total
  v_decision := 'auto_continue';

  INSERT INTO public.protocol_continuity_decisions (
    user_id, subscription_id, previous_subscription_id, gap_days, decision
  ) VALUES (
    NEW.user_id, NEW.id, v_prev.id, v_gap, v_decision
  )
  ON CONFLICT (subscription_id) DO UPDATE SET 
    decision = EXCLUDED.decision,
    gap_days = EXCLUDED.gap_days;

  RETURN NEW;
END;
$$;

-- Atualiza decisões pendentes para continue (resolvendo o backlog)
UPDATE public.protocol_continuity_decisions 
SET decision = 'continue', 
    decided_at = now(), 
    decided_by = NULL 
WHERE decision = 'pending';

-- Corrige o cupom no template de 30 dias se existir
UPDATE public.crm_message_templates
SET body = REPLACE(body, 'RETOMA10', 'RETOMA20')
WHERE automation_trigger = 'renewal_d30' AND body LIKE '%RETOMA10%';

CREATE OR REPLACE FUNCTION public.crm_route_inbound(
  _phone text,
  _body text,
  _provider text,
  _message_id text DEFAULT NULL,
  _instance_id text DEFAULT NULL,
  _media_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone_norm text := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
  v_contact public.crm_contacts;
  v_profile RECORD;
  v_sub RECORD;
  v_has_active_sub boolean := false;
  v_user_id uuid := NULL;
  v_channel text;
  v_priority text := 'medium';
  v_status text;
  v_ticket public.crm_tickets;
  v_lower text := lower(coalesce(_body,''));
  v_tags text[] := ARRAY[]::text[];
BEGIN
  IF length(v_phone_norm) < 8 THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;

  SELECT user_id, full_name, email INTO v_profile
  FROM public.find_profile_by_phone(v_phone_norm)
  LIMIT 1;

  v_user_id := v_profile.user_id;

  IF v_user_id IS NOT NULL THEN
    SELECT s.* INTO v_sub
    FROM public.subscriptions s
    WHERE s.user_id = v_user_id
      AND s.status = 'active'
      AND s.end_date >= current_date
    ORDER BY s.end_date DESC
    LIMIT 1;

    v_has_active_sub := FOUND;
  END IF;

  IF v_has_active_sub THEN
    v_channel := 'fale_nutri';
    v_status := 'aguardando';
  ELSE
    v_channel := 'sth_one';
    v_status := 'novo_lead';
  END IF;

  IF v_lower ~ '(colateral|tontura|press[aã]o|glicemia|rea[cç][aã]o|ansiedade|sintoma|sangra|mal[- ]estar|\bdor\b)' THEN
    v_priority := 'sensitive';
    v_tags := array_append(v_tags, 'Prioridade sensível');
    IF v_channel = 'fale_nutri' THEN
      v_status := 'prioridade_sensivel';
    END IF;
  END IF;

  INSERT INTO public.crm_contacts (phone, full_name, email, user_id, kind)
  VALUES (
    v_phone_norm,
    v_profile.full_name,
    v_profile.email,
    v_user_id,
    CASE
      WHEN v_has_active_sub THEN 'student'
      WHEN v_user_id IS NOT NULL THEN 'lead'
      ELSE 'unknown'
    END
  )
  ON CONFLICT (phone) DO UPDATE SET
    full_name = COALESCE(public.crm_contacts.full_name, EXCLUDED.full_name),
    email = COALESCE(public.crm_contacts.email, EXCLUDED.email),
    user_id = COALESCE(public.crm_contacts.user_id, EXCLUDED.user_id),
    kind = EXCLUDED.kind,
    updated_at = now()
  RETURNING * INTO v_contact;

  SELECT * INTO v_ticket
  FROM public.crm_tickets
  WHERE contact_id = v_contact.id
    AND channel = v_channel
    AND closed_at IS NULL
  ORDER BY last_message_at DESC
  LIMIT 1;

  IF v_ticket.id IS NULL THEN
    INSERT INTO public.crm_tickets (channel, contact_id, type, status, priority, tags, last_message_at)
    VALUES (
      v_channel,
      v_contact.id,
      CASE WHEN v_channel = 'fale_nutri' THEN 'nutri' ELSE 'lead' END,
      v_status,
      v_priority,
      COALESCE(v_tags, ARRAY[]::text[]),
      now()
    )
    RETURNING * INTO v_ticket;
  ELSE
    UPDATE public.crm_tickets
    SET last_message_at = now(),
        priority = CASE WHEN v_priority = 'sensitive' THEN 'sensitive' ELSE priority END,
        status = CASE WHEN v_priority = 'sensitive' AND channel = 'fale_nutri' THEN 'prioridade_sensivel' ELSE status END,
        tags = COALESCE((SELECT array_agg(DISTINCT t) FROM unnest(COALESCE(tags, ARRAY[]::text[]) || COALESCE(v_tags, ARRAY[]::text[])) AS t), ARRAY[]::text[])
    WHERE id = v_ticket.id
    RETURNING * INTO v_ticket;
  END IF;

  INSERT INTO public.crm_ticket_messages (ticket_id, direction, body, media_url, message_id, instance_id, phone, status, provider)
  VALUES (v_ticket.id, 'in', _body, _media_url, _message_id, _instance_id, v_phone_norm, 'received', _provider);

  RETURN v_ticket.id;
END;
$$;
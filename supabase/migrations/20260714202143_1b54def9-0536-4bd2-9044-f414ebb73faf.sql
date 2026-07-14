CREATE OR REPLACE FUNCTION public.notify_authorization_change(_user_id uuid, _kind text, _action text, _previous text, _new text, _reason text, _actor_user uuid, _actor_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
  v_email text;
  v_admin_email text;
BEGIN
  SELECT full_name, email INTO v_name, v_email FROM public.profiles WHERE user_id = _user_id LIMIT 1;

  INSERT INTO public.authorization_audit (user_id, kind, action, previous_value, new_value, reason, actor_user_id, actor_role)
  VALUES (_user_id, _kind, _action, _previous, _new, _reason, _actor_user, _actor_role);

  INSERT INTO public.authorization_change_notifications (student_user_id, student_name, kind, action, previous_value, new_value, reason)
  VALUES (_user_id, COALESCE(v_name, 'Aluno'), _kind, _action, _previous, _new, _reason);

  INSERT INTO public.automation_logs (event_type, contact_phone, reason, metadata, severity)
  VALUES (
    'authorization_change',
    '',
    _reason,
    jsonb_build_object(
      'user_id', _user_id,
      'kind', _kind,
      'action', _action,
      'previous', _previous,
      'new', _new,
      'actor', _actor_user,
      'actor_role', _actor_role
    ),
    'info'
  );

  SELECT value INTO v_admin_email FROM public.payment_settings WHERE key = 'admin_email' LIMIT 1;
  IF v_admin_email IS NOT NULL AND v_admin_email <> '' THEN
    INSERT INTO public.email_scheduled_sends (
      template_key, recipient_user_id, recipient_email, recipient_name, template_data, source
    ) VALUES (
      'admin-authorization-change', NULL, v_admin_email, 'Equipe STH METHOD',
      jsonb_build_object(
        'studentName', COALESCE(v_name,'Aluno'),
        'studentEmail', COALESCE(v_email,''),
        'kind', _kind,
        'action', _action,
        'previousValue', COALESCE(_previous,''),
        'newValue', COALESCE(_new,''),
        'reason', COALESCE(_reason,''),
        'occurredAt', to_char(now() AT TIME ZONE 'America/Sao_Paulo','DD/MM/YYYY HH24:MI')
      ),
      'trigger:authorization_change'
    );
  END IF;
END;
$function$;
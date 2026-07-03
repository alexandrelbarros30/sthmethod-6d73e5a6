DO $$
DECLARE
  r RECORD;
  new_payload JSONB;
  new_msg_id TEXT;
BEGIN
  FOR r IN
    SELECT msg_id, message
    FROM pgmq.q_transactional_emails_dlq
    WHERE message->>'label' IN ('welcome-registration','welcome-post-payment','payment-receipt-first','payment-receipt-renewal')
      AND message->>'to' <> 'team@sthmethod.com.br'
  LOOP
    new_msg_id := gen_random_uuid()::text;
    new_payload := r.message
      || jsonb_build_object('message_id', new_msg_id, 'queued_at', now());
    PERFORM pgmq.send('transactional_emails', new_payload);
    INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
    VALUES (new_msg_id, r.message->>'label', r.message->>'to', 'pending');
    PERFORM pgmq.delete('transactional_emails_dlq', r.msg_id);
  END LOOP;
END $$;
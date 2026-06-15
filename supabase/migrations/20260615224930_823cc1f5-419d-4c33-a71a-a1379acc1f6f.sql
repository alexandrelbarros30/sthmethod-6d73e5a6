INSERT INTO public.email_template_settings (template_key, category, enabled, auto_send, automation_rule)
VALUES
  ('inactivity-reminder','transactional',true,true,'{"type":"inactivity_days","days":30}'::jsonb),
  ('renewal-reminder','transactional',true,true,'{"type":"before_expiry_days","days":5}'::jsonb),
  ('subscription-expired','transactional',true,true,'{"type":"after_expiry_days","days":1}'::jsonb)
ON CONFLICT (template_key) DO UPDATE
SET enabled=true, auto_send=true, automation_rule=EXCLUDED.automation_rule, updated_at=now();
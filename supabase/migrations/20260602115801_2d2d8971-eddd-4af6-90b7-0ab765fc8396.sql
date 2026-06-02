UPDATE public.crm_message_templates
SET automation_trigger = 'payment_welcome',
    is_automatic = true,
    active = true,
    channel = 'wapi'
WHERE id = 'fab67661-6629-49d4-9356-1d292dc7c6ef';
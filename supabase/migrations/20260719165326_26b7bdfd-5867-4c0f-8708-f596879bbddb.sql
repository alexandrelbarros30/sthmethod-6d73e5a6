
-- 1) Fix function search_path for user-created queue helper functions
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- 2) Remove overly broad storage policies on body-images (keep owner/role-scoped ones)
DROP POLICY IF EXISTS "Authenticated update body images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload body images" ON storage.objects;

-- 3) Restrict custom_payment_links: remove public read; server (service_role via edge functions) still reads
DROP POLICY IF EXISTS "Anyone can read active payment links" ON public.custom_payment_links;
REVOKE SELECT ON public.custom_payment_links FROM anon;

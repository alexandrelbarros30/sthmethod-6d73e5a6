
-- Public bucket for billing attachments (images/PDFs sent via WhatsApp)
INSERT INTO storage.buckets (id, name, public)
VALUES ('billing-attachments', 'billing-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Billing attachments publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'billing-attachments');

CREATE POLICY "Authenticated can upload billing attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'billing-attachments');

CREATE POLICY "Authenticated can update billing attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'billing-attachments');

CREATE POLICY "Authenticated can delete billing attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'billing-attachments');

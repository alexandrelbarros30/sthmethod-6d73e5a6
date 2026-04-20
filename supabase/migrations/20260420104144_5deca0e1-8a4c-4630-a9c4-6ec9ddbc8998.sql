ALTER TABLE public.student_protocols ADD COLUMN IF NOT EXISTS storage_path text;

UPDATE public.student_protocols
SET storage_path = substring(pdf_url FROM '/storage/v1/object/public/documents/(.*)$')
WHERE storage_path IS NULL
  AND pdf_url IS NOT NULL
  AND pdf_url LIKE '%/storage/v1/object/public/documents/%';
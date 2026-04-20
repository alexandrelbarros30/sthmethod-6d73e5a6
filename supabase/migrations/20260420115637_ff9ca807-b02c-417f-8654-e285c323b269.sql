-- Backfill storage_path em clinical_documents a partir do file_url público
UPDATE public.clinical_documents
SET storage_path = regexp_replace(
  file_url,
  '^.*/storage/v1/object/public/documents/',
  ''
)
WHERE storage_path IS NULL
  AND file_url LIKE '%/storage/v1/object/public/documents/%';
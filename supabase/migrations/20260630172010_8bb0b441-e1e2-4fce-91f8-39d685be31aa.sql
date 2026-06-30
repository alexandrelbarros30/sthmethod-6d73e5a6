
-- Backfill storage_path from public-style image_url when missing
UPDATE public.body_images
SET storage_path = substring(image_url FROM '/storage/v1/object/public/body-images/(.*)$')
WHERE storage_path IS NULL
  AND image_url LIKE '%/storage/v1/object/public/body-images/%';

-- Auto-fill storage_path on future inserts (defensive trigger)
CREATE OR REPLACE FUNCTION public.body_images_fill_storage_path()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.storage_path IS NULL AND NEW.image_url IS NOT NULL THEN
    NEW.storage_path := substring(NEW.image_url FROM '/storage/v1/object/public/body-images/(.*)$');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_body_images_fill_storage_path ON public.body_images;
CREATE TRIGGER trg_body_images_fill_storage_path
  BEFORE INSERT OR UPDATE ON public.body_images
  FOR EACH ROW EXECUTE FUNCTION public.body_images_fill_storage_path();

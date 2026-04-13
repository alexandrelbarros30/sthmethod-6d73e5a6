
-- Create a function to notify when photos are uploaded
CREATE OR REPLACE FUNCTION public.notify_photo_upload()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_name TEXT;
  v_existing_id UUID;
BEGIN
  IF NEW.type NOT IN ('front', 'back', 'profile') THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  SELECT id INTO v_existing_id FROM public.evolution_notifications
  WHERE student_user_id = NEW.user_id
    AND created_at::date = now()::date
  ORDER BY created_at DESC LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.evolution_notifications SET has_photos = true WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.evolution_notifications (student_user_id, student_name, has_photos)
    VALUES (NEW.user_id, COALESCE(v_name, 'Aluno'), true);
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on body_images
CREATE TRIGGER on_body_image_insert
  AFTER INSERT ON public.body_images
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_photo_upload();

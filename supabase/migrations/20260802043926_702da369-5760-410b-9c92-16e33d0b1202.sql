CREATE OR REPLACE FUNCTION public.sync_ai_generation_to_master()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF COALESCE(NEW.content, '') = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.kind = 'diet' THEN
    INSERT INTO public.student_diets (id, user_id, title, content, visible, is_active, tab_label, created_at, updated_at)
    VALUES (NEW.id, NEW.user_id, 'Cardápio STH AI', NEW.content, true, false, 'STH AI', NEW.created_at, now())
    ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();
  ELSIF NEW.kind = 'workout' THEN
    INSERT INTO public.student_trainings (id, user_id, title, content, is_active, created_at, updated_at)
    VALUES (NEW.id, NEW.user_id, 'Treino STH AI', NEW.content, false, NEW.created_at, now())
    ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();
  ELSIF NEW.kind = 'analysis' THEN
    INSERT INTO public.student_clinical_analyses (id, user_id, title, scope, report_html, model, released_to_student, released_at, created_at, updated_at)
    VALUES (NEW.id, NEW.user_id, 'Análise STH AI', 'full', NEW.content, NEW.model, true, NEW.created_at, NEW.created_at, now())
    ON CONFLICT (id) DO UPDATE SET report_html = EXCLUDED.report_html, updated_at = now();
  END IF;

  RETURN NEW;
END;
$function$;
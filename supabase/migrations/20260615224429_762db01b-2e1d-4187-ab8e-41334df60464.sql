-- 1) Welcome on profile insert
CREATE OR REPLACE FUNCTION public.enqueue_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.email_scheduled_sends (
    template_key, recipient_user_id, recipient_email, recipient_name, template_data, source
  ) VALUES (
    'welcome-registration', NEW.user_id, NEW.email, COALESCE(NEW.full_name, ''),
    jsonb_build_object('name', COALESCE(NEW.full_name, ''), 'siteUrl', 'https://sthmethod.com'),
    'event:profile_created'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_welcome_email ON public.profiles;
CREATE TRIGGER trg_enqueue_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_welcome_email();

-- 2) Email change confirm on profile email update
CREATE OR REPLACE FUNCTION public.enqueue_email_change_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' OR NEW.email = OLD.email THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.email_scheduled_sends (
    template_key, recipient_user_id, recipient_email, recipient_name, template_data, source
  ) VALUES (
    'email-change-confirm', NEW.user_id, NEW.email, COALESCE(NEW.full_name, ''),
    jsonb_build_object('name', COALESCE(NEW.full_name, ''), 'oldEmail', OLD.email, 'newEmail', NEW.email),
    'event:profile_email_changed'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_email_change_confirm ON public.profiles;
CREATE TRIGGER trg_enqueue_email_change_confirm
  AFTER UPDATE OF email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_email_change_confirm();

-- 3) Plan changed on subscription update
CREATE OR REPLACE FUNCTION public.enqueue_plan_changed_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_old_plan TEXT;
  v_new_plan TEXT;
BEGIN
  IF NEW.plan_id IS NULL OR NEW.plan_id = OLD.plan_id THEN
    RETURN NEW;
  END IF;

  SELECT email, full_name INTO v_email, v_name
  FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_old_plan FROM public.plans WHERE id = OLD.plan_id LIMIT 1;
  SELECT name INTO v_new_plan FROM public.plans WHERE id = NEW.plan_id LIMIT 1;

  INSERT INTO public.email_scheduled_sends (
    template_key, recipient_user_id, recipient_email, recipient_name, template_data, source
  ) VALUES (
    'plan-changed', NEW.user_id, v_email, COALESCE(v_name, ''),
    jsonb_build_object(
      'name', COALESCE(v_name, ''),
      'oldPlan', COALESCE(v_old_plan, ''),
      'newPlan', COALESCE(v_new_plan, '')
    ),
    'event:plan_changed'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_plan_changed_email ON public.subscriptions;
CREATE TRIGGER trg_enqueue_plan_changed_email
  AFTER UPDATE OF plan_id ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_plan_changed_email();

-- HIGH: Revoke email queue RPCs from public roles (only service_role/edge functions should call these)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;

-- HIGH: Tighten automation_logs read to admins (contained PII-like metadata)
DROP POLICY IF EXISTS "Allow authenticated read access to automation_logs" ON public.automation_logs;
CREATE POLICY "Admins can read automation_logs"
  ON public.automation_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- MEDIUM: Scope PII/user-owned policies from public role → authenticated only
ALTER POLICY "Users manage own checkins" ON public.daily_checkins TO authenticated;
ALTER POLICY "Admins view all checkins" ON public.daily_checkins TO authenticated;
ALTER POLICY "Consultants view their students checkins" ON public.daily_checkins TO authenticated;

ALTER POLICY "Admins can manage foods" ON public.diet_foods TO authenticated;
ALTER POLICY "Users can view own foods" ON public.diet_foods TO authenticated;
ALTER POLICY "Admins can manage meals" ON public.diet_meals TO authenticated;
ALTER POLICY "Users can view own meals" ON public.diet_meals TO authenticated;

ALTER POLICY "Admins can manage protocols" ON public.protocols TO authenticated;
ALTER POLICY "Users can view own protocols" ON public.protocols TO authenticated;

ALTER POLICY "Admins can manage diets" ON public.student_diets TO authenticated;
ALTER POLICY "Users can view own diet" ON public.student_diets TO authenticated;

ALTER POLICY "Admins can manage student protocols" ON public.student_protocols TO authenticated;
ALTER POLICY "Users can view own student protocol" ON public.student_protocols TO authenticated;

ALTER POLICY "Admins can manage student trainings" ON public.student_trainings TO authenticated;
ALTER POLICY "Users can view own student training" ON public.student_trainings TO authenticated;

ALTER POLICY "Admins can manage exercises" ON public.training_exercises TO authenticated;
ALTER POLICY "Users can view own exercises" ON public.training_exercises TO authenticated;

ALTER POLICY "Admins can manage training" ON public.training_weeks TO authenticated;
ALTER POLICY "Users can view own training" ON public.training_weeks TO authenticated;

ALTER POLICY "Admins can manage subscriptions" ON public.subscriptions TO authenticated;
ALTER POLICY "Users can view own subscription" ON public.subscriptions TO authenticated;

ALTER POLICY "Admins can manage roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can view all roles" ON public.user_roles TO authenticated;
ALTER POLICY "Users can view own roles" ON public.user_roles TO authenticated;

ALTER POLICY "Admins can manage payment settings" ON public.payment_settings TO authenticated;
ALTER POLICY "Authenticated can view payment settings" ON public.payment_settings TO authenticated;
ALTER POLICY "Admins can manage payment links" ON public.plan_payment_links TO authenticated;
ALTER POLICY "Authenticated can view payment links" ON public.plan_payment_links TO authenticated;
ALTER POLICY "Admins can manage plans" ON public.plans TO authenticated;

ALTER POLICY "Admins can manage content" ON public.content TO authenticated;
ALTER POLICY "Admins can manage crm_flow_steps" ON public.crm_flow_steps TO authenticated;

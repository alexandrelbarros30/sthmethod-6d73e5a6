
-- 1. crm_away_locks: enable RLS + staff-only
ALTER TABLE public.crm_away_locks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM staff manage away locks" ON public.crm_away_locks;
CREATE POLICY "CRM staff manage away locks" ON public.crm_away_locks
  FOR ALL TO authenticated
  USING (public.is_crm_staff(auth.uid()))
  WITH CHECK (public.is_crm_staff(auth.uid()));

-- 2. queue_join_requests: drop blanket SELECT policies
DROP POLICY IF EXISTS "Anyone can read queue requests" ON public.queue_join_requests;
DROP POLICY IF EXISTS "Anyone can view queue request by id" ON public.queue_join_requests;

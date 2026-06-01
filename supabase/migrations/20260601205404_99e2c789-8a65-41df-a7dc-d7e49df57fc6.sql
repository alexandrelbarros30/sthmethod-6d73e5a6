CREATE TABLE public.supercoach_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','updated','not_found','divergent_name','review_manually')),
  last_updated_at TIMESTAMPTZ,
  updated_by UUID,
  updated_by_name TEXT,
  observation TEXT DEFAULT '',
  divergent_found_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supercoach_sync TO authenticated;
GRANT ALL ON public.supercoach_sync TO service_role;

ALTER TABLE public.supercoach_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM staff can view supercoach sync"
  ON public.supercoach_sync FOR SELECT
  TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can insert supercoach sync"
  ON public.supercoach_sync FOR INSERT
  TO authenticated
  WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can update supercoach sync"
  ON public.supercoach_sync FOR UPDATE
  TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "Admins can delete supercoach sync"
  ON public.supercoach_sync FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_supercoach_sync_updated_at
BEFORE UPDATE ON public.supercoach_sync
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.supercoach_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  performed_by UUID,
  performed_by_name TEXT,
  observation TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.supercoach_sync_logs TO authenticated;
GRANT ALL ON public.supercoach_sync_logs TO service_role;

ALTER TABLE public.supercoach_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM staff can view supercoach logs"
  ON public.supercoach_sync_logs FOR SELECT
  TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can insert supercoach logs"
  ON public.supercoach_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE INDEX idx_supercoach_sync_status ON public.supercoach_sync(status);
CREATE INDEX idx_supercoach_sync_logs_user ON public.supercoach_sync_logs(user_id, created_at DESC);

CREATE TABLE public.nutri_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  body TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  wapi_message_id TEXT,
  error TEXT,
  sent_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nutri_messages_user ON public.nutri_messages(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutri_messages TO authenticated;
GRANT ALL ON public.nutri_messages TO service_role;
ALTER TABLE public.nutri_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage nutri_messages" ON public.nutri_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.nutri_opt_outs (
  user_id UUID NOT NULL PRIMARY KEY,
  reason TEXT,
  opted_out_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutri_opt_outs TO authenticated;
GRANT ALL ON public.nutri_opt_outs TO service_role;
ALTER TABLE public.nutri_opt_outs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage nutri_opt_outs" ON public.nutri_opt_outs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.nutri_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutri_templates TO authenticated;
GRANT ALL ON public.nutri_templates TO service_role;
ALTER TABLE public.nutri_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage nutri_templates" ON public.nutri_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_nutri_templates_updated
  BEFORE UPDATE ON public.nutri_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

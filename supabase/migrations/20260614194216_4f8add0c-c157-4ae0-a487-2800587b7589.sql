
CREATE TABLE public.crm_group_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  weekday smallint NOT NULL,
  hour_brt smallint NOT NULL,
  message_body text NOT NULL,
  image_urls text[] NOT NULL DEFAULT '{}',
  text_first boolean NOT NULL DEFAULT false,
  group_ids text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_group_broadcasts TO authenticated;
GRANT ALL ON public.crm_group_broadcasts TO service_role;

ALTER TABLE public.crm_group_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage group broadcasts"
ON public.crm_group_broadcasts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_group_broadcasts_updated
BEFORE UPDATE ON public.crm_group_broadcasts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.crm_ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'contact' CHECK (scope IN ('contact','global')),
  contact_phone text,
  user_id uuid,
  category text NOT NULL DEFAULT 'fato' CHECK (category IN ('preferencia','objetivo','restricao','historico','contexto','fato','aprendizado')),
  content text NOT NULL,
  source_conversation_id uuid,
  source_message_id uuid,
  confidence numeric DEFAULT 0.8,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_ai_memory_phone_idx ON public.crm_ai_memory (contact_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_ai_memory_scope_idx ON public.crm_ai_memory (scope, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_ai_memory_user_idx ON public.crm_ai_memory (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ai_memory TO authenticated;
GRANT ALL ON public.crm_ai_memory TO service_role;

ALTER TABLE public.crm_ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM staff can view AI memory"
  ON public.crm_ai_memory FOR SELECT TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can insert AI memory"
  ON public.crm_ai_memory FOR INSERT TO authenticated
  WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can update AI memory"
  ON public.crm_ai_memory FOR UPDATE TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE POLICY "CRM staff can delete AI memory"
  ON public.crm_ai_memory FOR DELETE TO authenticated
  USING (public.is_crm_staff(auth.uid()));

CREATE TRIGGER crm_ai_memory_updated_at
  BEFORE UPDATE ON public.crm_ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

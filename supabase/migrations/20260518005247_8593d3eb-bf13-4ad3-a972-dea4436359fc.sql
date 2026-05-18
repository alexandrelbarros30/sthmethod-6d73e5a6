CREATE TABLE public.student_flow_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  cadastro_recebido_at TIMESTAMPTZ DEFAULT now(),
  dados_em_analise_at TIMESTAMPTZ,
  estrategia_estruturando_at TIMESTAMPTZ,
  plataforma_liberada_at TIMESTAMPTZ,
  plano_avancado_pronto_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_flow_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage student_flow_status"
ON public.student_flow_status FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultors view linked student_flow_status"
ON public.student_flow_status FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors update linked student_flow_status"
ON public.student_flow_status FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id))
WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Consultors insert linked student_flow_status"
ON public.student_flow_status FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Students view own student_flow_status"
ON public.student_flow_status FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_student_flow_status_updated_at
BEFORE UPDATE ON public.student_flow_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create on profile creation
CREATE OR REPLACE FUNCTION public.create_flow_status_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_flow_status (user_id, cadastro_recebido_at)
  VALUES (NEW.id, now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_flow_status_on_signup ON auth.users;
CREATE TRIGGER create_flow_status_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_flow_status_on_new_user();

-- Backfill existing users
INSERT INTO public.student_flow_status (user_id, cadastro_recebido_at)
SELECT user_id, created_at FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
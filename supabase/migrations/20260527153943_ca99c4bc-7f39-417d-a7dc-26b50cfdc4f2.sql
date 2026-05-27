
-- =========================================================
-- CRM Atendimento (Tickets) — STH One + Fale com o Nutri
-- =========================================================

-- Sequences para protocolo
CREATE SEQUENCE IF NOT EXISTS public.crm_protocol_seq_sth START 1;
CREATE SEQUENCE IF NOT EXISTS public.crm_protocol_seq_nut START 1;

-- ---------- crm_contacts ----------
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  full_name text,
  email text,
  user_id uuid,
  kind text NOT NULL DEFAULT 'unknown', -- lead | student | unknown
  plan_name text,
  plan_start date,
  plan_end date,
  plan_status text,
  last_weight_update timestamptz,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_contacts_user ON public.crm_contacts(user_id);
CREATE INDEX idx_crm_contacts_kind ON public.crm_contacts(kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view contacts" ON public.crm_contacts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'));
CREATE POLICY "Staff modify contacts" ON public.crm_contacts FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'));

-- ---------- crm_tickets ----------
CREATE TABLE public.crm_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol text UNIQUE,
  protocol_seq bigint,
  channel text NOT NULL, -- sth_one | fale_nutri
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'lead', -- lead|aluno|financeiro|suporte|nutri
  status text NOT NULL DEFAULT 'novo_lead',
  priority text NOT NULL DEFAULT 'medium', -- low|medium|high|sensitive
  assigned_to uuid,
  tags text[] NOT NULL DEFAULT '{}',
  internal_notes text,
  first_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_tickets_contact ON public.crm_tickets(contact_id);
CREATE INDEX idx_crm_tickets_status ON public.crm_tickets(channel, status);
CREATE INDEX idx_crm_tickets_priority ON public.crm_tickets(priority);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tickets TO authenticated;
GRANT ALL ON public.crm_tickets TO service_role;
ALTER TABLE public.crm_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view tickets" ON public.crm_tickets FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'));
CREATE POLICY "Staff modify tickets" ON public.crm_tickets FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'));

-- Trigger: gera protocolo
CREATE OR REPLACE FUNCTION public.crm_set_protocol()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.protocol IS NULL THEN
    IF NEW.channel = 'fale_nutri' THEN
      NEW.protocol_seq := nextval('public.crm_protocol_seq_nut');
      NEW.protocol := 'NUT-' || lpad(NEW.protocol_seq::text, 6, '0');
    ELSE
      NEW.protocol_seq := nextval('public.crm_protocol_seq_sth');
      NEW.protocol := 'STH-' || lpad(NEW.protocol_seq::text, 6, '0');
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_tickets_protocol
BEFORE INSERT ON public.crm_tickets
FOR EACH ROW EXECUTE FUNCTION public.crm_set_protocol();

CREATE TRIGGER trg_crm_tickets_updated
BEFORE UPDATE ON public.crm_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_crm_contacts_updated
BEFORE UPDATE ON public.crm_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- crm_ticket_messages ----------
CREATE TABLE public.crm_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.crm_tickets(id) ON DELETE CASCADE,
  direction text NOT NULL, -- in | out
  body text,
  media_url text,
  message_id text,
  instance_id text,
  phone text,
  status text DEFAULT 'received',
  provider text DEFAULT 'wapi',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_msgs_ticket ON public.crm_ticket_messages(ticket_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ticket_messages TO authenticated;
GRANT ALL ON public.crm_ticket_messages TO service_role;
ALTER TABLE public.crm_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view ticket messages" ON public.crm_ticket_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'));
CREATE POLICY "Staff modify ticket messages" ON public.crm_ticket_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'));

-- ---------- crm_op_templates ----------
CREATE TABLE public.crm_op_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL, -- sth_one | fale_nutri | both
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_op_templates TO authenticated;
GRANT ALL ON public.crm_op_templates TO service_role;
ALTER TABLE public.crm_op_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view op templates" ON public.crm_op_templates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'consultor') OR public.has_role(auth.uid(),'assistente') OR public.has_role(auth.uid(),'financeiro'));
CREATE POLICY "Staff modify op templates" ON public.crm_op_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_crm_op_templates_updated
BEFORE UPDATE ON public.crm_op_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- crm_webhook_logs ----------
CREATE TABLE public.crm_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  payload jsonb,
  processed boolean DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crm_webhook_logs TO authenticated;
GRANT ALL ON public.crm_webhook_logs TO service_role;
ALTER TABLE public.crm_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view webhook logs" ON public.crm_webhook_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'));

-- ---------- Função de roteamento ----------
CREATE OR REPLACE FUNCTION public.crm_route_inbound(
  _phone text,
  _body text,
  _provider text,
  _message_id text DEFAULT NULL,
  _instance_id text DEFAULT NULL,
  _media_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone_norm text := regexp_replace(coalesce(_phone,''), '\D', '', 'g');
  v_contact public.crm_contacts;
  v_profile RECORD;
  v_sub RECORD;
  v_channel text;
  v_priority text := 'medium';
  v_status text;
  v_ticket public.crm_tickets;
  v_lower text := lower(coalesce(_body,''));
  v_tags text[] := '{}';
BEGIN
  IF length(v_phone_norm) < 8 THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;

  -- Tenta achar perfil pelo telefone
  SELECT user_id, full_name, email INTO v_profile FROM public.find_profile_by_phone(v_phone_norm) LIMIT 1;

  -- Verifica se é aluno ativo
  IF v_profile.user_id IS NOT NULL THEN
    SELECT s.* INTO v_sub FROM public.subscriptions s
    WHERE s.user_id = v_profile.user_id AND s.status = 'active' AND s.end_date >= current_date
    ORDER BY s.end_date DESC LIMIT 1;
  END IF;

  IF v_sub.id IS NOT NULL THEN
    v_channel := 'fale_nutri';
    v_status := 'aguardando';
  ELSE
    v_channel := 'sth_one';
    v_status := 'novo_lead';
  END IF;

  -- Prioridade
  IF v_lower ~ '(colateral|tontura|press[aã]o|glicemia|rea[cç][aã]o|ansiedade|sintoma|sangra|mal[- ]estar|\bdor\b)' THEN
    v_priority := 'sensitive';
    v_tags := array_append(v_tags, 'Prioridade sensível');
    IF v_channel = 'fale_nutri' THEN v_status := 'prioridade_sensivel'; END IF;
  END IF;

  -- Upsert contato
  INSERT INTO public.crm_contacts (phone, full_name, email, user_id, kind)
  VALUES (
    v_phone_norm,
    v_profile.full_name,
    v_profile.email,
    v_profile.user_id,
    CASE WHEN v_sub.id IS NOT NULL THEN 'student' WHEN v_profile.user_id IS NOT NULL THEN 'lead' ELSE 'unknown' END
  )
  ON CONFLICT (phone) DO UPDATE SET
    full_name = COALESCE(public.crm_contacts.full_name, EXCLUDED.full_name),
    email = COALESCE(public.crm_contacts.email, EXCLUDED.email),
    user_id = COALESCE(public.crm_contacts.user_id, EXCLUDED.user_id),
    kind = EXCLUDED.kind,
    updated_at = now()
  RETURNING * INTO v_contact;

  -- Procura ticket aberto no canal
  SELECT * INTO v_ticket FROM public.crm_tickets
  WHERE contact_id = v_contact.id AND channel = v_channel AND closed_at IS NULL
  ORDER BY last_message_at DESC LIMIT 1;

  IF v_ticket.id IS NULL THEN
    INSERT INTO public.crm_tickets (channel, contact_id, type, status, priority, tags)
    VALUES (
      v_channel, v_contact.id,
      CASE WHEN v_channel = 'fale_nutri' THEN 'nutri' ELSE 'lead' END,
      v_status, v_priority, v_tags
    ) RETURNING * INTO v_ticket;
  ELSE
    UPDATE public.crm_tickets
    SET last_message_at = now(),
        priority = CASE WHEN v_priority = 'sensitive' THEN 'sensitive' ELSE priority END,
        status = CASE WHEN v_priority = 'sensitive' AND channel = 'fale_nutri' THEN 'prioridade_sensivel' ELSE status END,
        tags = (SELECT array_agg(DISTINCT t) FROM unnest(tags || v_tags) AS t)
    WHERE id = v_ticket.id;
  END IF;

  -- Insere mensagem
  INSERT INTO public.crm_ticket_messages (ticket_id, direction, body, media_url, message_id, instance_id, phone, status, provider)
  VALUES (v_ticket.id, 'in', _body, _media_url, _message_id, _instance_id, v_phone_norm, 'received', _provider);

  RETURN v_ticket.id;
END $$;

-- ---------- Seed tags (apenas template list via templates) e templates iniciais ----------
INSERT INTO public.crm_op_templates (channel, category, title, body) VALUES
('sth_one','boas_vindas','Boas-vindas STH One','Olá! Aqui é da STH METHOD 👋 Recebemos sua mensagem. Em instantes um especialista vai te atender.'),
('fale_nutri','boas_vindas','Boas-vindas Fale com o Nutri','Olá! Você está no canal Fale com o Nutri 🌿 Sua mensagem foi registrada. Em breve nossa equipe responde com todo cuidado.'),
('sth_one','registrado','Atendimento registrado','Seu atendimento foi registrado com o protocolo {protocolo}. Em breve retornamos.'),
('fale_nutri','registrado','Atendimento registrado (Nutri)','Recebemos sua mensagem — protocolo {protocolo}. Logo a equipe responde.'),
('sth_one','pagamento_pendente','Pagamento pendente','Identificamos que seu pagamento está pendente. Quer que eu te envie o link novamente?'),
('fale_nutri','atualizacao','Solicitação de atualização','Para seguir com seu acompanhamento, pode nos enviar peso atual e fotos? 🙏'),
('both','encerramento','Encerramento','Atendimento finalizado. Qualquer coisa, é só chamar por aqui 💚'),
('both','ausencia','Ausência / fora de horário','No momento estamos fora do horário de atendimento. Vamos te responder assim que retornarmos.');

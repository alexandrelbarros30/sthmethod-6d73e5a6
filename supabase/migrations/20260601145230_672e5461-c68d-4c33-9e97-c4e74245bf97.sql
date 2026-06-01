
-- =========================================
-- CRM Operational Layer
-- =========================================

-- Helper: any staff role
CREATE OR REPLACE FUNCTION public.is_crm_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','admin_viewer','consultor','assistente','financeiro')
  )
$$;

-- =========================================
-- crm_conversations
-- =========================================
CREATE TABLE public.crm_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  display_name text,
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  pinned boolean NOT NULL DEFAULT false,
  unread_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  last_message_preview text,
  last_direction text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_conversations_last_message ON public.crm_conversations (last_message_at DESC NULLS LAST);
CREATE INDEX idx_crm_conversations_status ON public.crm_conversations (status);
CREATE INDEX idx_crm_conversations_assigned ON public.crm_conversations (assigned_to);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_conversations TO authenticated;
GRANT ALL ON public.crm_conversations TO service_role;
ALTER TABLE public.crm_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff read conversations" ON public.crm_conversations FOR SELECT TO authenticated USING (public.is_crm_staff(auth.uid()));
CREATE POLICY "crm staff write conversations" ON public.crm_conversations FOR INSERT TO authenticated WITH CHECK (public.is_crm_staff(auth.uid()));
CREATE POLICY "crm staff update conversations" ON public.crm_conversations FOR UPDATE TO authenticated USING (public.is_crm_staff(auth.uid()));
CREATE POLICY "crm admin delete conversations" ON public.crm_conversations FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_crm_conversations_updated BEFORE UPDATE ON public.crm_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- crm_messages
-- =========================================
CREATE TABLE public.crm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.crm_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL,
  body text,
  media_url text,
  media_type text,
  sent_by uuid,
  source text NOT NULL DEFAULT 'manual',
  external_id text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_messages_conv ON public.crm_messages (conversation_id, created_at DESC);
CREATE INDEX idx_crm_messages_external ON public.crm_messages (external_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_messages TO authenticated;
GRANT ALL ON public.crm_messages TO service_role;
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff read messages" ON public.crm_messages FOR SELECT TO authenticated USING (public.is_crm_staff(auth.uid()));
CREATE POLICY "crm staff insert messages" ON public.crm_messages FOR INSERT TO authenticated WITH CHECK (public.is_crm_staff(auth.uid()));
CREATE POLICY "crm staff update messages" ON public.crm_messages FOR UPDATE TO authenticated USING (public.is_crm_staff(auth.uid()));
CREATE POLICY "crm admin delete messages" ON public.crm_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Auto-update conversation last_message_* when message inserted
CREATE OR REPLACE FUNCTION public.crm_update_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.crm_conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.body,''), 200),
    last_direction = NEW.direction,
    unread_count = CASE WHEN NEW.direction = 'in' THEN unread_count + 1 ELSE unread_count END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_crm_message_bump AFTER INSERT ON public.crm_messages FOR EACH ROW EXECUTE FUNCTION public.crm_update_conversation_on_message();

-- =========================================
-- crm_tags
-- =========================================
CREATE TABLE public.crm_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#22c55e',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tags TO authenticated;
GRANT ALL ON public.crm_tags TO service_role;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff manage tags" ON public.crm_tags FOR ALL TO authenticated USING (public.is_crm_staff(auth.uid())) WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE TABLE public.crm_conversation_tags (
  conversation_id uuid NOT NULL REFERENCES public.crm_conversations(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.crm_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_conversation_tags TO authenticated;
GRANT ALL ON public.crm_conversation_tags TO service_role;
ALTER TABLE public.crm_conversation_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff manage conv tags" ON public.crm_conversation_tags FOR ALL TO authenticated USING (public.is_crm_staff(auth.uid())) WITH CHECK (public.is_crm_staff(auth.uid()));

-- =========================================
-- crm_tasks
-- =========================================
CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.crm_conversations(id) ON DELETE SET NULL,
  phone text,
  title text NOT NULL,
  notes text,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'todo',
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_tasks_status ON public.crm_tasks (status, due_at);
CREATE INDEX idx_crm_tasks_assigned ON public.crm_tasks (assigned_to);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff manage tasks" ON public.crm_tasks FOR ALL TO authenticated USING (public.is_crm_staff(auth.uid())) WITH CHECK (public.is_crm_staff(auth.uid()));
CREATE TRIGGER trg_crm_tasks_updated BEFORE UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- crm_ai_runs
-- =========================================
CREATE TABLE public.crm_ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.crm_conversations(id) ON DELETE CASCADE,
  prompt text,
  response text,
  model text,
  tokens integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_ai_runs_conv ON public.crm_ai_runs (conversation_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ai_runs TO authenticated;
GRANT ALL ON public.crm_ai_runs TO service_role;
ALTER TABLE public.crm_ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff manage ai runs" ON public.crm_ai_runs FOR ALL TO authenticated USING (public.is_crm_staff(auth.uid())) WITH CHECK (public.is_crm_staff(auth.uid()));

-- =========================================
-- crm_campaigns
-- =========================================
CREATE TABLE public.crm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message_template text NOT NULL,
  media_url text,
  target_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaigns TO authenticated;
GRANT ALL ON public.crm_campaigns TO service_role;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff manage campaigns" ON public.crm_campaigns FOR ALL TO authenticated USING (public.is_crm_staff(auth.uid())) WITH CHECK (public.is_crm_staff(auth.uid()));
CREATE TRIGGER trg_crm_campaigns_updated BEFORE UPDATE ON public.crm_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
  phone text NOT NULL,
  display_name text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_recipients_campaign ON public.crm_campaign_recipients (campaign_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaign_recipients TO authenticated;
GRANT ALL ON public.crm_campaign_recipients TO service_role;
ALTER TABLE public.crm_campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff manage recipients" ON public.crm_campaign_recipients FOR ALL TO authenticated USING (public.is_crm_staff(auth.uid())) WITH CHECK (public.is_crm_staff(auth.uid()));

-- =========================================
-- crm_queues
-- =========================================
CREATE TABLE public.crm_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  color text NOT NULL DEFAULT '#22c55e',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_queues TO authenticated;
GRANT ALL ON public.crm_queues TO service_role;
ALTER TABLE public.crm_queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff manage queues" ON public.crm_queues FOR ALL TO authenticated USING (public.is_crm_staff(auth.uid())) WITH CHECK (public.is_crm_staff(auth.uid()));

CREATE TABLE public.crm_queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES public.crm_queues(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.crm_conversations(id) ON DELETE CASCADE,
  phone text,
  priority integer NOT NULL DEFAULT 0,
  entered_at timestamptz NOT NULL DEFAULT now(),
  picked_by uuid,
  picked_at timestamptz,
  closed_at timestamptz,
  notes text
);
CREATE INDEX idx_crm_queue_items_queue ON public.crm_queue_items (queue_id, closed_at, priority DESC, entered_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_queue_items TO authenticated;
GRANT ALL ON public.crm_queue_items TO service_role;
ALTER TABLE public.crm_queue_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm staff manage queue items" ON public.crm_queue_items FOR ALL TO authenticated USING (public.is_crm_staff(auth.uid())) WITH CHECK (public.is_crm_staff(auth.uid()));

-- Seed default queues
INSERT INTO public.crm_queues (name, type, color, sort_order) VALUES
  ('Atendimento Comercial', 'comercial', '#22c55e', 1),
  ('Fale com o Nutri', 'nutri', '#3b82f6', 2),
  ('Suporte', 'suporte', '#f59e0b', 3);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_queue_items;

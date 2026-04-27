-- Tokens permanentes por aluno (cada aluno tem um link único reutilizável)
CREATE TABLE public.queue_link_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  student_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_queue_link_tokens_student ON public.queue_link_tokens(student_user_id);
CREATE INDEX idx_queue_link_tokens_token ON public.queue_link_tokens(token);

ALTER TABLE public.queue_link_tokens ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler um token específico (validar link público)
CREATE POLICY "Anyone can read queue tokens"
ON public.queue_link_tokens FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage queue tokens"
ON public.queue_link_tokens FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Solicitações de entrada na fila
CREATE TABLE public.queue_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  student_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'waiting', -- waiting | called | done
  joined_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  done_at timestamptz,
  source text NOT NULL DEFAULT 'whatsapp_link',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_queue_join_status ON public.queue_join_requests(status, joined_at);
CREATE INDEX idx_queue_join_student ON public.queue_join_requests(student_user_id);

ALTER TABLE public.queue_join_requests ENABLE ROW LEVEL SECURITY;

-- Qualquer um (anon e auth) pode INSERIR uma solicitação (a página pública precisa registrar sem login)
CREATE POLICY "Anyone can insert queue requests"
ON public.queue_join_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Qualquer um pode LER solicitações (necessário para mostrar status na página pública)
-- Sem dados sensíveis: só nome + status + horário
CREATE POLICY "Anyone can read queue requests"
ON public.queue_join_requests FOR SELECT
TO anon, authenticated
USING (true);

-- Admins gerenciam tudo
CREATE POLICY "Admins manage queue join requests"
ON public.queue_join_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Consultores veem dos seus alunos
CREATE POLICY "Consultors view linked queue join requests"
ON public.queue_join_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'consultor'::app_role) AND is_consultant_of(auth.uid(), student_user_id));

-- Trigger updated_at
CREATE TRIGGER update_queue_join_requests_updated_at
BEFORE UPDATE ON public.queue_join_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_join_requests;
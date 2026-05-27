
-- 1) Extend nutri_templates with tone + tags + plan scope
ALTER TABLE public.nutri_templates
  ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'humanizada',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS plan_scope TEXT DEFAULT 'all';

-- 2) nutri_conversations
CREATE TABLE IF NOT EXISTS public.nutri_conversations (
  user_id UUID PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'open', -- open | pending | waiting_student | waiting_nutri | closed
  priority TEXT NOT NULL DEFAULT 'medium', -- high | medium | low
  category TEXT, -- dieta | treino | protocolo | exames | renovacao | financeiro | sintoma | outro
  tags TEXT[] NOT NULL DEFAULT '{}',
  assigned_to UUID,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_inbound_at TIMESTAMPTZ,
  last_message_preview TEXT,
  internal_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutri_conversations_status ON public.nutri_conversations(status, priority, last_message_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutri_conversations TO authenticated;
GRANT ALL ON public.nutri_conversations TO service_role;
ALTER TABLE public.nutri_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage nutri_conversations" ON public.nutri_conversations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_nutri_conv_updated
  BEFORE UPDATE ON public.nutri_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Trigger: keep conversation in sync after each message + priority heuristic
CREATE OR REPLACE FUNCTION public.sync_nutri_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_priority TEXT := 'medium';
  v_category TEXT := NULL;
  v_lower TEXT := lower(coalesce(NEW.body, ''));
BEGIN
  -- Priority heuristic on inbound text
  IF NEW.direction = 'in' THEN
    IF v_lower ~ '(colateral|sintoma|dor\s|mal[- ]estar|tontura|enjoo|sangra|urgente|emerg)' THEN
      v_priority := 'high';
      v_category := 'sintoma';
    ELSIF v_lower ~ '(renovar|renova|vence|expira|pagamento|cobranc)' THEN
      v_priority := 'medium';
      v_category := 'renovacao';
    ELSIF v_lower ~ '(dieta|refeic|alimenta|cardapio|cardápio)' THEN
      v_category := 'dieta';
    ELSIF v_lower ~ '(treino|exerc|musculac|academia)' THEN
      v_category := 'treino';
    ELSIF v_lower ~ '(protocolo|suplement|ciclo|dose)' THEN
      v_priority := 'high';
      v_category := 'protocolo';
    ELSIF v_lower ~ '(exame|laborator|sangue)' THEN
      v_category := 'exames';
    END IF;
  END IF;

  INSERT INTO public.nutri_conversations (
    user_id, status, priority, category,
    last_message_at, last_inbound_at, last_message_preview,
    unread_count
  ) VALUES (
    NEW.user_id,
    CASE WHEN NEW.direction = 'in' THEN 'open' ELSE 'waiting_student' END,
    v_priority,
    v_category,
    NEW.created_at,
    CASE WHEN NEW.direction = 'in' THEN NEW.created_at ELSE NULL END,
    left(coalesce(NEW.body, ''), 160),
    CASE WHEN NEW.direction = 'in' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    last_message_at = NEW.created_at,
    last_inbound_at = CASE WHEN NEW.direction = 'in' THEN NEW.created_at ELSE nutri_conversations.last_inbound_at END,
    last_message_preview = left(coalesce(NEW.body, ''), 160),
    unread_count = CASE WHEN NEW.direction = 'in' THEN nutri_conversations.unread_count + 1 ELSE nutri_conversations.unread_count END,
    status = CASE
      WHEN NEW.direction = 'in' THEN 'open'
      WHEN NEW.direction = 'out' AND nutri_conversations.status = 'open' THEN 'waiting_student'
      ELSE nutri_conversations.status
    END,
    priority = CASE
      WHEN NEW.direction = 'in' AND v_priority = 'high' THEN 'high'
      ELSE nutri_conversations.priority
    END,
    category = COALESCE(nutri_conversations.category, v_category),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_nutri_conv ON public.nutri_messages;
CREATE TRIGGER trg_sync_nutri_conv
  AFTER INSERT ON public.nutri_messages
  FOR EACH ROW EXECUTE FUNCTION public.sync_nutri_conversation();

-- 4) Seed templates (48 = 12 categorias x 4 tons). Idempotent via title unique-ish check.
INSERT INTO public.nutri_templates (title, content, category, tone, active)
SELECT t.title, t.content, t.category, t.tone, true
FROM (VALUES
  -- BOAS-VINDAS
  ('Boas-vindas — Curta', 'Olá, {nome}! Bem-vindo(a) à STH METHOD. Estou aqui para te apoiar nessa jornada.', 'boas_vindas', 'curta'),
  ('Boas-vindas — Humanizada', 'Olá, {nome}! Que alegria ter você com a gente. Estou aqui para te acompanhar de perto e garantir que cada passo da sua evolução seja seguro e estratégico.', 'boas_vindas', 'humanizada'),
  ('Boas-vindas — Técnica', 'Olá, {nome}. Seu acompanhamento na STH METHOD foi iniciado. Acesse a plataforma para preencher anamnese e enviar peso e fotos atualizadas para configuração inicial do protocolo.', 'boas_vindas', 'tecnica'),
  ('Boas-vindas — Motivacional', 'Bem-vindo(a), {nome}! Hoje começa uma nova fase. Foco, consistência e estratégia — vamos juntos transformar seu corpo e sua saúde.', 'boas_vindas', 'motivacional'),
  -- DIETA
  ('Dieta — Curta', 'Olá, {nome}! Sua dieta já está disponível na plataforma. Qualquer dúvida, me chame por aqui.', 'dieta', 'curta'),
  ('Dieta — Humanizada', 'Olá, {nome}! Sua dieta foi liberada com carinho e estratégia. Lembre-se: consistência diária é o que constrói resultado. Estou por aqui para qualquer ajuste.', 'dieta', 'humanizada'),
  ('Dieta — Técnica', 'Olá, {nome}. Sua prescrição alimentar foi publicada. Macros, fontes e horários estão na plataforma. Siga conforme orientado e registre adesão para ajustes precisos.', 'dieta', 'tecnica'),
  ('Dieta — Motivacional', 'Olá, {nome}! Cada refeição é um passo para sua melhor versão. Siga o plano — o corpo responde a quem é fiel ao processo.', 'dieta', 'motivacional'),
  -- TREINO
  ('Treino — Curta', 'Olá, {nome}! Seu treino está liberado na plataforma. Bons treinos!', 'treino', 'curta'),
  ('Treino — Humanizada', 'Olá, {nome}! Seu novo treino já está disponível. Respeite a execução, foque na qualidade e me conte como se sentiu nos primeiros dias.', 'treino', 'humanizada'),
  ('Treino — Técnica', 'Olá, {nome}. Programa de treino publicado: divisão, séries, repetições e intensidades alvo na plataforma. Registre cargas para evoluir a periodização.', 'treino', 'tecnica'),
  ('Treino — Motivacional', 'Olá, {nome}! O treino certo, executado com técnica, muda tudo. Vamos com tudo — você é capaz de mais do que imagina.', 'treino', 'motivacional'),
  -- PROTOCOLO
  ('Protocolo — Curta', 'Olá, {nome}! Seu protocolo está publicado na plataforma. Siga as orientações e me chame em qualquer dúvida.', 'protocolo', 'curta'),
  ('Protocolo — Humanizada', 'Olá, {nome}! Seu protocolo foi cuidadosamente montado para sua fase atual. Qualquer dúvida ou sensação diferente, me avise imediatamente.', 'protocolo', 'humanizada'),
  ('Protocolo — Técnica', 'Olá, {nome}. Protocolo atualizado conforme avaliação. Doses, janelas e ordens de uso estão na plataforma. Não altere conduta sem validação.', 'protocolo', 'tecnica'),
  ('Protocolo — Motivacional', 'Olá, {nome}! Estratégia certa + execução fiel = resultado garantido. Vamos juntos respeitar cada etapa.', 'protocolo', 'motivacional'),
  -- EXAMES
  ('Exames — Curta', 'Olá, {nome}! Envie seus exames pela plataforma para que possamos analisar.', 'exames', 'curta'),
  ('Exames — Humanizada', 'Olá, {nome}! Para seguirmos com segurança e precisão, peço que envie seus exames mais recentes pela plataforma. Assim avalio cada marcador com calma.', 'exames', 'humanizada'),
  ('Exames — Técnica', 'Olá, {nome}. Solicito envio dos exames laboratoriais (perfil hormonal, lipídico, hepático, renal, glicêmico) na plataforma para reavaliação completa.', 'exames', 'tecnica'),
  ('Exames — Motivacional', 'Olá, {nome}! Saúde de verdade se mede com dados. Envie seus exames e vamos transformar números em estratégia.', 'exames', 'motivacional'),
  -- ATUALIZACAO
  ('Atualização pendente — Curta', 'Olá, {nome}! Identificamos que sua atualização ainda não foi enviada. Para ajustar sua dieta, treino e protocolo com precisão, envie seu peso atual e fotos pela plataforma.', 'atualizacao', 'curta'),
  ('Atualização pendente — Humanizada', 'Olá, {nome}! Passando para te lembrar com carinho que sua atualização é essencial para continuarmos evoluindo com segurança e estratégia. Envie seu peso atual e fotos pela plataforma.', 'atualizacao', 'humanizada'),
  ('Atualização pendente — Técnica', 'Olá, {nome}. Para avaliarmos sua evolução e realizarmos ajustes no planejamento, precisamos da atualização de peso, fotos e informações recentes na plataforma. Sem esses dados, a precisão do protocolo fica limitada.', 'atualizacao', 'tecnica'),
  ('Atualização pendente — Motivacional', 'Olá, {nome}! Resultado não vem só da execução, vem também dos ajustes certos. Envie sua atualização na plataforma para continuarmos destravando sua evolução.', 'atualizacao', 'motivacional'),
  -- RENOVACAO
  ('Renovação — Curta', 'Olá, {nome}! Seu plano está próximo do vencimento. Quer renovar para mantermos o ritmo?', 'renovacao', 'curta'),
  ('Renovação — Humanizada', 'Olá, {nome}! Seu plano está próximo do fim e seria uma pena pausar o momento que você está vivendo. Vamos renovar e seguir evoluindo juntos?', 'renovacao', 'humanizada'),
  ('Renovação — Técnica', 'Olá, {nome}. Seu plano encerra em breve. Para manter a continuidade do protocolo, dieta e ajustes periódicos, providencie a renovação pela plataforma.', 'renovacao', 'tecnica'),
  ('Renovação — Motivacional', 'Olá, {nome}! Você já construiu muito até aqui. Renove e continue colhendo os frutos do seu esforço.', 'renovacao', 'motivacional'),
  -- FINANCEIRO
  ('Financeiro — Curta', 'Olá, {nome}! Sobre o financeiro: confira o link de pagamento na plataforma.', 'financeiro', 'curta'),
  ('Financeiro — Humanizada', 'Olá, {nome}! Estou à disposição para qualquer dúvida sobre o financeiro. Pode contar comigo para orientar o pagamento da forma mais tranquila.', 'financeiro', 'humanizada'),
  ('Financeiro — Técnica', 'Olá, {nome}. Segue link de pagamento na plataforma. Após confirmação, seu plano é reativado automaticamente em até alguns minutos.', 'financeiro', 'tecnica'),
  ('Financeiro — Motivacional', 'Olá, {nome}! Investir em você é o melhor retorno possível. Estou aqui para facilitar essa etapa.', 'financeiro', 'motivacional'),
  -- ENCERRAMENTO
  ('Encerramento — Curta', 'Olá, {nome}! Identificamos que seu plano não está mais ativo. Para retomar o suporte individual, renove pela plataforma.', 'encerramento', 'curta'),
  ('Encerramento — Humanizada', 'Olá, {nome}! Senti sua ausência no canal. Seu plano não está ativo no momento e, para garantir um acompanhamento à altura do que você merece, peço que renove para retomarmos.', 'encerramento', 'humanizada'),
  ('Encerramento — Técnica', 'Olá, {nome}. Seu plano está encerrado e o canal Fale com o Nutri é exclusivo para alunos ativos. Renove pela plataforma para reabrir o atendimento individual.', 'encerramento', 'tecnica'),
  ('Encerramento — Motivacional', 'Olá, {nome}! Não pare agora. Renove e siga construindo a versão mais forte de você.', 'encerramento', 'motivacional'),
  -- DIRECIONAMENTO
  ('Direcionamento plataforma — Curta', 'Olá, {nome}! Essa informação está na plataforma, na aba correspondente. Dê uma olhada e me avise se precisar.', 'direcionamento', 'curta'),
  ('Direcionamento plataforma — Humanizada', 'Olá, {nome}! Já deixei isso disponível na plataforma para você consultar com calma. Qualquer dúvida depois da leitura, me chame por aqui.', 'direcionamento', 'humanizada'),
  ('Direcionamento plataforma — Técnica', 'Olá, {nome}. Consulta disponível na plataforma > seção indicada. Em caso de divergência, retorne com print da tela.', 'direcionamento', 'tecnica'),
  ('Direcionamento plataforma — Motivacional', 'Olá, {nome}! Tudo pensado para facilitar sua rotina está na plataforma. Aproveite cada recurso — eles foram feitos para você.', 'direcionamento', 'motivacional'),
  -- HUMANIZADA (genérica)
  ('Acolhimento — Curta', 'Olá, {nome}! Estou por aqui, conte comigo.', 'humanizada', 'curta'),
  ('Acolhimento — Humanizada', 'Olá, {nome}! Recebi sua mensagem e quero entender melhor o que você está sentindo. Me conte com calma para eu te orientar do jeito certo.', 'humanizada', 'humanizada'),
  ('Acolhimento — Técnica', 'Olá, {nome}. Registrei sua demanda. Vou revisar seu histórico recente e retorno com a orientação adequada.', 'humanizada', 'tecnica'),
  ('Acolhimento — Motivacional', 'Olá, {nome}! Cada dúvida é uma chance de evoluir. Estou aqui para garantir que você nunca caminhe sozinho(a).', 'humanizada', 'motivacional'),
  -- AUTOMATICA (menu)
  ('Menu automático — Curta', E'Olá, {nome}! 👋\nEscolha:\n1️⃣ Dieta\n2️⃣ Treino\n3️⃣ Protocolo\n4️⃣ Exames/atualizações\n5️⃣ Renovação\n6️⃣ Outros', 'automatica', 'curta'),
  ('Menu automático — Humanizada', E'Olá, {nome}! 👋 Você está no canal exclusivo *Fale com o Nutri* da STH METHOD.\nPara agilizar seu atendimento, escolha uma opção:\n1️⃣ Dieta\n2️⃣ Treino\n3️⃣ Protocolo\n4️⃣ Exames / atualizações\n5️⃣ Renovação\n6️⃣ Outros assuntos\nDigite apenas o número da opção desejada.', 'automatica', 'humanizada'),
  ('Menu automático — Técnica', E'Canal Fale com o Nutri — STH METHOD.\nOpções: [1] Dieta [2] Treino [3] Protocolo [4] Exames [5] Renovação [6] Outros.', 'automatica', 'tecnica'),
  ('Menu automático — Motivacional', E'Olá, {nome}! Pronto(a) para destravar mais uma etapa? Escolha:\n1️⃣ Dieta · 2️⃣ Treino · 3️⃣ Protocolo · 4️⃣ Exames · 5️⃣ Renovação · 6️⃣ Outros', 'automatica', 'motivacional')
) AS t(title, content, category, tone)
WHERE NOT EXISTS (SELECT 1 FROM public.nutri_templates nt WHERE nt.title = t.title);

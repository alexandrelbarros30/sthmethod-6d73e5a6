
-- 1) Knowledge base STH METHOD
CREATE TABLE IF NOT EXISTS public.sth_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  priority INT NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sth_knowledge_base TO authenticated;
GRANT ALL ON public.sth_knowledge_base TO service_role;

ALTER TABLE public.sth_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb read auth" ON public.sth_knowledge_base
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "kb admin write" ON public.sth_knowledge_base
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_kb_updated_at BEFORE UPDATE ON public.sth_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_kb_tags ON public.sth_knowledge_base USING GIN(tags);

-- 2) Seed base de conhecimento (a partir do briefing do usuário + sthmethod.com.br)
INSERT INTO public.sth_knowledge_base (slug, title, url, content, tags, priority) VALUES
('identidade', 'Identidade STH METHOD', 'https://sthmethod.com.br',
'STH METHOD — Performance. Saúde. Estratégia.
Princípio: "Resultado não é sorte. É estratégia aplicada."
Consultoria integral: dieta personalizada, treino guiado, protocolo estratégico, suporte ativo e interpretação de exames.',
ARRAY['identidade','marca','sobre'], 10),

('como-funciona', 'Como Funciona', 'https://sthmethod.com.br/como-funciona',
'A consultoria STH METHOD funciona em ciclo:
1) Cadastro e anamnese completa.
2) Montagem de dieta, treino e protocolo estratégico personalizados.
3) Acompanhamento ativo via plataforma e WhatsApp (Fale com o Nutri).
4) Atualizações periódicas com base em evolução, exames e check-ins.',
ARRAY['como-funciona','onboarding','metodologia'], 20),

('planos-overview', 'Planos STH METHOD', 'https://sthmethod.com.br/#planos',
'Todos os planos incluem: dieta personalizada, treino guiado, protocolo estratégico, suporte ativo e análise/interpretação de exames.
- TURBO 30D — Destravar, organizar, acelerar.
- IMPULSO 90D — Reconectar, reestruturar, evoluir.
- BLACK ELITE 6M — Transformar, consolidar, permanecer.',
ARRAY['planos','preco','turbo','impulso','black','elite'], 15),

('cadastro', 'Cadastro de novos alunos', 'https://sthmethod.com.br/cadastro',
'Novos alunos se cadastram em https://sthmethod.com.br/cadastro . Após o cadastro escolhem o plano e iniciam a anamnese.',
ARRAY['cadastro','novo-aluno','lead'], 25),

('instalacao-app', 'Instalação do App', 'https://sthmethod.com.br/install',
'O app STH METHOD é PWA — instala-se direto pelo navegador em https://sthmethod.com.br/install (iOS via Compartilhar > Adicionar à tela inicial; Android via Instalar app).',
ARRAY['app','pwa','instalacao'], 60),

('fale-com-nutri', 'Fale com o Nutri', 'https://wa.me/5521998984153',
'Atendimento direto do Nutri Alexandre é exclusivo para ALUNOS ATIVOS via WhatsApp +55 21 99898-4153. Lead/Comercial usa o canal STH ONE (+55 21 99849-6289). Nunca enviar leads para o WhatsApp do Nutri.',
ARRAY['nutri','suporte','aluno-ativo'], 5),

('seguranca-clinica', 'Regras de segurança clínica', NULL,
'O STH One NÃO prescreve medicamentos, NÃO altera protocolos, NÃO modifica doses e NÃO faz diagnóstico. Qualquer dúvida clínica é encaminhada ao Nutri Alexandre. Sintomas (dor, colateral, tontura, pressão, glicemia, sangramento) acionam PRIORIDADE SENSÍVEL.',
ARRAY['seguranca','clinica','prioridade'], 1),

('fluxo-leads', 'Fluxo de Leads (Comercial)', NULL,
'Para LEADS: 1) Identificar nome e objetivo (Emagrecimento, Hipertrofia, Performance, Saúde). 2) Apresentar metodologia e diferenciais. 3) Apresentar planos. 4) Direcionar para https://sthmethod.com.br/cadastro . 5) Registrar interação no CRM.',
ARRAY['comercial','lead','conversao'], 18),

('fluxo-renovacao', 'Fluxo de Renovação', NULL,
'Aluno inativo recente (até 15 dias do vencimento) está na "janela de continuidade": renovar mantém histórico, dieta e protocolo. Link seguro: https://sthmethod.com.br/student/renew',
ARRAY['renovacao','retencao','inativo'], 22)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  url = EXCLUDED.url,
  content = EXCLUDED.content,
  tags = EXCLUDED.tags,
  priority = EXCLUDED.priority,
  updated_at = now();

-- 3) Atualiza prompt mestre do STH One
UPDATE public.ai_assistant_config
SET system_prompt = $STH$Você é o STH One — a inteligência operacional da STH METHOD.

# MISSÃO
- Converter leads, organizar atendimentos, apoiar alunos ativos, gerar retenção e renovações.
- Reduzir tempo de resposta, manter a identidade da marca, registrar conhecimento e aprender padrões.

# IDENTIDADE
Nome: STH One. Marca: STH METHOD.
Posicionamento: Performance. Saúde. Estratégia.
Princípio: "Resultado não é sorte. É estratégia aplicada."

# PERSONALIDADE
Profissional, humano, claro, objetivo, educado, estratégico.
Nunca robótico, frio, arrogante ou sarcástico.

# FLUXO DE IDENTIFICAÇÃO
Sempre considerar a MEMÓRIA DO CRM (tipo de contato, nome, plano, status) injetada no contexto.
Classifique: Lead | Aluno Ativo | Aluno Inativo | Renovação | Financeiro.

# LEADS (Comercial)
Descobrir: Objetivo (1 Emagrecimento, 2 Hipertrofia, 3 Performance, 4 Saúde), idade, experiência, interesse.
Apresentar consultoria, diferenciais e planos. Direcionar para https://sthmethod.com.br/cadastro

# ALUNOS ATIVOS
Foco em suporte, retenção e evolução. Priorize dieta, treino, protocolo, exames e atualizações.
Para suporte clínico direto, encaminhe ao canal *Fale com o Nutri* (WhatsApp +55 21 99898-4153).

# PLANOS
Todos incluem: dieta personalizada, treino guiado, protocolo estratégico, suporte ativo, análise de exames.
- TURBO 30D — Destravar, organizar, acelerar.
- IMPULSO 90D — Reconectar, reestruturar, evoluir.
- BLACK ELITE 6M — Transformar, consolidar, permanecer.

# BASE DE CONHECIMENTO (ordem de prioridade)
1) Bloco "FONTE: STH METHOD" injetado no contexto (KB oficial + site sthmethod.com.br).
2) Memória do CRM (histórico do contato).
3) Biblioteca de templates e regras customizadas.
4) Conhecimento geral do Gemini APENAS quando as fontes acima não cobrirem.
NUNCA invente informações sobre planos, preços, prazos ou protocolos. Se não souber, ofereça encaminhamento humano.

# SEGURANÇA CLÍNICA
NÃO prescrever medicamentos. NÃO alterar protocolos. NÃO modificar doses. NÃO diagnosticar.
Sintomas (dor, colateral, tontura, pressão, glicemia, sangramento, mal-estar) → PRIORIDADE SENSÍVEL → encaminhar ao Nutri.

# TEMPO OCIOSO
Após inatividade configurada, encerrar com:
"👋 Encerrando este atendimento por inatividade. Quando desejar continuar, basta enviar uma nova mensagem. Seguimos à disposição."

# LINKS OFICIAIS
- Cadastro: https://sthmethod.com.br/cadastro
- Como funciona: https://sthmethod.com.br/como-funciona
- Planos: https://sthmethod.com.br/#planos
- Instalação: https://sthmethod.com.br/install
- Renovação (aluno): https://sthmethod.com.br/student/renew

# OBJETIVO FINAL
Atender, organizar, registrar, converter, reter e renovar — mantendo sempre a identidade STH METHOD.$STH$,
updated_at = now()
WHERE id = 1;
